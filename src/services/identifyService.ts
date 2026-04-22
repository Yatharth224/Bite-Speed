import db from "../db/client"


export async function findOrCreateContact(email?: string, phone?: string) {

  // Step 1 - Check if there's any existing contact with this email or phone
  const existingContacts = await db.contact.findMany({
    where: {
      deletedAt: null,
      OR: [
        email ? { email } : undefined,
        phone ? { phoneNumber: phone } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: { createdAt: "asc" },
  })

  // If nothing is found, this person is new to the system
  if (existingContacts.length === 0) {
    const created = await db.contact.create({
      data: {
        email,
        phoneNumber: phone,
        linkPrecedence: "primary",
      },
    })
    return formatResponse(created, [])
  }

  // Collect all primary contact IDs from the matches we found
  const primaryIdSet = new Set<number>()

  for (const contact of existingContacts) {
    if (contact.linkPrecedence === "primary") {
      primaryIdSet.add(contact.id)
    } else {
      if (contact.linkedId) primaryIdSet.add(contact.linkedId)
    }
  }

  // Fetch all those primary contacts
  const primaryContacts = await db.contact.findMany({
    where: {
      id: { in: Array.from(primaryIdSet) },
      linkPrecedence: "primary",
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  })

  // The oldest contact becomes the source of truth
  let oldestContact = primaryContacts[0]

  // If we ended up with multiple primaries, it means they actually belong to the same person
  // So we convert the newer ones into secondary contacts
  if (primaryContacts.length > 1) {
    for (let i = 1; i < primaryContacts.length; i++) {
      const newerContact = primaryContacts[i]

      // Point all secondaries of the newer primary to the oldest primary
      await db.contact.updateMany({
        where: { linkedId: newerContact.id, deletedAt: null },
        data: { linkedId: oldestContact.id, updatedAt: new Date() },
      })

      // Convert the newer primary itself into a secondary
      await db.contact.update({
        where: { id: newerContact.id },
        data: {
          linkedId: oldestContact.id,
          linkPrecedence: "secondary",
          updatedAt: new Date(),
        },
      })
    }
  }

  // Fetch the complete group linked to the oldest primary
  const wholeGroup = await db.contact.findMany({
    where: {
      deletedAt: null,
      OR: [
        { id: oldestContact.id },
        { linkedId: oldestContact.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  })

  // Check if the incoming request has any new email or phone
  const emailsSeen = new Set(wholeGroup.map((c: any) => c.email).filter(Boolean))
  const phonesSeen = new Set(wholeGroup.map((c: any) => c.phoneNumber).filter(Boolean))

  const isNewEmail = email && !emailsSeen.has(email)
  const isNewPhone = phone && !phonesSeen.has(phone)

  // If there’s new information, create a new secondary contact
  if (isNewEmail || isNewPhone) {
    const newSecondary = await db.contact.create({
      data: {
        email,
        phoneNumber: phone,
        linkedId: oldestContact.id,
        linkPrecedence: "secondary",
      },
    })
    wholeGroup.push(newSecondary)
  }

  const secondaryList = wholeGroup.filter((c: any) => c.linkPrecedence === "secondary")

  return formatResponse(oldestContact, secondaryList)
}


function formatResponse(primary: any, secondaries: any[]) {
  const emails = new Set<string>()
  const phones = new Set<string>()

  if (primary.email) emails.add(primary.email)
  if (primary.phoneNumber) phones.add(primary.phoneNumber)

  for (const s of secondaries as any[]) {
    if (s.email) emails.add(s.email)
    if (s.phoneNumber) phones.add(s.phoneNumber)
  }

  return {
    primaryContatctId: primary.id,
    emails: Array.from(emails),
    phoneNumbers: Array.from(phones),
    secondaryContactIds: secondaries.map((s: any) => s.id),
  }
}
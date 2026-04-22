import { Request, Response } from "express"
import { findOrCreateContact } from "../services/identifyService"

// Regex for Indian mobile numbers - must be 10 digits starting with 6, 7, 8, or 9
const indianPhoneRegex = /^[6-9]\d{9}$/

// Simple regex to validate basic email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function identifyUser(req: Request, res: Response) {
  try {
    const { email, phoneNumber } = req.body

    // Ensure at least one identifier is provided
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: "At least one of email or phoneNumber is required"
      })
      return
    }

    // Validate email if it exists in the request
    if (email) {
      if (typeof email !== "string" || !emailRegex.test(email)) {
        res.status(400).json({ error: "Please provide a valid email address" })
        return
      }
    }

    // Validate phone number if it exists in the request
    if (phoneNumber) {
      const phoneStr = String(phoneNumber)
      if (!indianPhoneRegex.test(phoneStr)) {
        res.status(400).json({ 
          error: "Please provide a valid 10 digit Indian mobile number" 
        })
        return
      }
    }

    // Normalize inputs before sending to service layer
    const phone = phoneNumber ? String(phoneNumber) : undefined
    const mail = email ? String(email).toLowerCase().trim() : undefined

    // Call service to find or create the contact
    const data = await findOrCreateContact(mail, phone)

    // Send back the unified contact response
    res.status(200).json({ contact: data })

  } catch (err) {
    // Log the error for debugging and return a generic server error
    console.error("error in /identify route:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
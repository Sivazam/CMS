interface SMSMessage {
  to: string
  message: string
}

interface Fast2SMSResponse {
  return: boolean
  request_id: string
  message: string[]
}

class SMSService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY || ""
    this.baseUrl = "https://www.fast2sms.com/dev/bulkV2"
  }

  async sendSMS(message: SMSMessage): Promise<boolean> {
    try {
      // For now, just log the message (you'll add actual Fast2SMS integration later)
      console.log("SMS would be sent:", {
        to: message.to,
        message: message.message,
        timestamp: new Date().toISOString()
      })

      // TODO: Implement actual Fast2SMS API call
      // const response = await fetch(this.baseUrl, {
      //   method: 'POST',
      //   headers: {
      //     'authorization': this.apiKey,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     route: 'q',
      //     message: message.message,
      //     language: 'english',
      //     numbers: message.to
      //   })
      // })
      
      // const data: Fast2SMSResponse = await response.json()
      // return data.return

      return true // Simulate success for now
    } catch (error) {
      console.error("SMS sending failed:", error)
      return false
    }
  }

  // Message templates
  getMessageTemplates() {
    return {
      registration: (venueName: string, expiryDate: string) => 
        `Thanks for trusting us. Ashes are safe with us. Storage registration made for 1 month, renew or collect by "${expiryDate}".`,
      
      renewalReminder: (venueName: string, daysLeft: number) =>
        `Your storage period at "${venueName}" are close to expire in ${daysLeft} days. Please renew to continue the storage.`,
      
      finalWarning: () =>
        `As we informed multiple times about your storage period expiry and renewal. We haven't heard from you even after multiple reachouts, so we will be mixing this ashes in River Godavari in next 3 days. If you still wish to extend storage period or collect it. We are happy to help. Thanks.`,
      
      deliveryConfirmation: (customerName: string) =>
        `Ashes safely collected by "${customerName}".`,
      
      paymentSuccess: (venueName: string, months: number) =>
        `Renewal of "${months}" months has been successful at location "${venueName}". Renew again in one month to continue.`,
      
      paymentFailure: () =>
        `Payment failed. Please try again or contact support.`
    }
  }
}

export const smsService = new SMSService()
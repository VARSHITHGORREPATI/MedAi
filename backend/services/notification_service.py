try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("ℹ️ Twilio not installed - SMS notifications disabled")

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    print("ℹ️ SendGrid not installed - email notifications via SendGrid disabled")

from typing import Optional

from config.settings import settings

class NotificationService:
    def __init__(self):
        # Initialize Twilio
        if TWILIO_AVAILABLE and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.twilio_client = None
        
        # Initialize SendGrid
        if SENDGRID_AVAILABLE and settings.SENDGRID_API_KEY:
            self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        else:
            self.sendgrid_client = None
    
    async def send_sms(self, to_phone: str, message: str) -> dict:
        """Send SMS notification via Twilio"""
        if not self.twilio_client:
            return {"success": False, "message": "Twilio not configured"}
        
        try:
            message = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        html_content: Optional[str] = None
    ) -> dict:
        """Send email notification via SendGrid"""
        if not self.sendgrid_client:
            return {"success": False, "message": "SendGrid not configured"}
        
        try:
            message = Mail(
                from_email=settings.SENDGRID_FROM_EMAIL,
                to_emails=to_email,
                subject=subject,
                plain_text_content=content,
                html_content=html_content or content
            )
            
            response = self.sendgrid_client.send(message)
            
            return {
                "success": True,
                "status_code": response.status_code
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_medicine_reminder(
        self,
        user_email: str,
        user_phone: Optional[str],
        medicine_name: str,
        dosage: str
    ) -> dict:
        """Send medicine reminder via SMS and/or email"""
        message = f"💊 MedAI Reminder: Time to take {medicine_name} ({dosage})"
        
        results = {}
        
        # Send SMS if phone number provided
        if user_phone:
            sms_result = await self.send_sms(user_phone, message)
            results["sms"] = sms_result
        
        # Send Email
        email_result = await self.send_email(
            user_email,
            "Medicine Reminder",
            message,
            f"<p><strong>💊 MedAI Reminder</strong></p><p>Time to take {medicine_name} ({dosage})</p>"
        )
        results["email"] = email_result
        
        return results
    
    async def send_appointment_reminder(
        self,
        user_email: str,
        user_phone: Optional[str],
        doctor_name: str,
        appointment_time: str,
        meeting_link: Optional[str] = None
    ) -> dict:
        """Send appointment reminder"""
        message = f"📅 MedAI Reminder: You have an appointment with {doctor_name} at {appointment_time}"
        
        if meeting_link:
            message += f"\nJoin here: {meeting_link}"
        
        results = {}
        
        if user_phone:
            sms_result = await self.send_sms(user_phone, message)
            results["sms"] = sms_result
        
        html_content = f"""
        <h2>📅 Appointment Reminder</h2>
        <p>You have an appointment with <strong>{doctor_name}</strong></p>
        <p>Time: <strong>{appointment_time}</strong></p>
        {f'<p><a href="{meeting_link}">Join Video Consultation</a></p>' if meeting_link else ''}
        """
        
        email_result = await self.send_email(
            user_email,
            "Appointment Reminder",
            message,
            html_content
        )
        results["email"] = email_result
        
        return results

import asyncio
from datetime import datetime, time, timedelta
from typing import List
import logging

from config.database import get_database
from services.notification_service import NotificationService
from bson import ObjectId

logger = logging.getLogger(__name__)

class ReminderScheduler:
    def __init__(self):
        self.notification_service = NotificationService()
        self.running = False
        self.check_interval = 60  # Check every minute
    
    async def start(self):
        """Start the reminder scheduler"""
        self.running = True
        logger.info("🔔 Medicine Reminder Scheduler started")
        
        while self.running:
            try:
                await self._check_and_send_reminders()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in reminder scheduler: {e}")
                await asyncio.sleep(self.check_interval)
    
    def stop(self):
        """Stop the reminder scheduler"""
        self.running = False
        logger.info("🛑 Medicine Reminder Scheduler stopped")
    
    async def _check_and_send_reminders(self):
        """Check for due reminders and send notifications"""
        db = get_database()
        now = datetime.utcnow()
        current_time = now.time()
        
        # Find active reminders
        active_reminders = await db.medicine_reminders.find({
            "is_active": True,
            "start_date": {"$lte": now},
            "$or": [
                {"end_date": {"$gte": now}},
                {"end_date": None}
            ]
        }).to_list(1000)
        
        reminders_sent = 0
        
        for reminder in active_reminders:
            try:
                # Check if any scheduled time matches current time (within 5 minutes)
                for scheduled_time in reminder.get("times", []):
                    # Convert string to time object if necessary
                    if isinstance(scheduled_time, str):
                        # Parse time string in format "HH:MM:SS" or "HH:MM"
                        scheduled_time = datetime.strptime(scheduled_time, '%H:%M:%S').time()
                    
                    if self._is_time_to_notify(scheduled_time, current_time):
                        # Check if already notified today at this time
                        if not await self._already_notified_today(
                            str(reminder["_id"]), 
                            scheduled_time
                        ):
                            await self._send_reminder_notification(reminder, scheduled_time)
                            reminders_sent += 1
            
            except Exception as e:
                logger.error(f"Error processing reminder {reminder.get('_id')}: {e}")
                continue
        
        if reminders_sent > 0:
            logger.info(f"✅ Sent {reminders_sent} medicine reminders")
    
    def _is_time_to_notify(self, scheduled_time: time, current_time: time) -> bool:
        """Check if scheduled time matches current time (within 5 minute window)"""
        scheduled_minutes = scheduled_time.hour * 60 + scheduled_time.minute
        current_minutes = current_time.hour * 60 + current_time.minute
        
        # Within 5 minute window
        return abs(scheduled_minutes - current_minutes) <= 5
    
    async def _already_notified_today(self, reminder_id: str, scheduled_time: time) -> bool:
        """Check if notification was already sent today for this time"""
        db = get_database()
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        log = await db.reminder_notifications.find_one({
            "reminder_id": reminder_id,
            "scheduled_time": scheduled_time.isoformat(),
            "sent_at": {"$gte": today_start}
        })
        
        return log is not None
    
    async def _send_reminder_notification(self, reminder: dict, scheduled_time: time):
        """Send email and SMS notification for a medicine reminder"""
        db = get_database()
        
        # Get user details
        user = await db.users.find_one({"_id": ObjectId(reminder["user_id"])})
        if not user:
            logger.warning(f"User not found for reminder: {reminder['_id']}")
            return
        
        medicine_name = reminder["medicine_name"]
        dosage = reminder["dosage"]
        instructions = reminder.get("notes", "Take as prescribed")
        
        # Prepare message
        message = f"""
🔔 Medicine Reminder

It's time to take your medicine!

Medicine: {medicine_name}
Dosage: {dosage}
Time: {scheduled_time.strftime('%I:%M %p')}
Instructions: {instructions}

Stay healthy! 💊
- MedAI Team
"""
        
        # Send email notification
        if user.get("email"):
            try:
                email_result = await self.notification_service.send_email(
                    to_email=user["email"],
                    subject=f"Medicine Reminder: {medicine_name}",
                    content=f"Time to take {medicine_name} ({dosage}) at {scheduled_time.strftime('%I:%M %p')}. {instructions}",
                    html_content=self._format_email_html(
                        medicine_name, 
                        dosage, 
                        scheduled_time, 
                        instructions, 
                        user["name"]
                    )
                )
                
                if email_result.get("success"):
                    logger.info(f"Email reminder sent to {user['email']}")
                else:
                    logger.warning(f"Email failed: {email_result.get('error')}")
            
            except Exception as e:
                logger.error(f"Error sending email: {e}")
        
        # Send SMS notification (if phone number available)
        phone = user.get("phone")
        if phone:
            try:
                sms_message = f"MedAI Reminder: Take {medicine_name} ({dosage}) at {scheduled_time.strftime('%I:%M %p')}. {instructions}"
                
                sms_result = await self.notification_service.send_sms(
                    to_phone=phone,
                    message=sms_message
                )
                
                if sms_result.get("success"):
                    logger.info(f"SMS reminder sent to {phone}")
                else:
                    logger.warning(f"SMS failed: {sms_result.get('error')}")
            
            except Exception as e:
                logger.error(f"Error sending SMS: {e}")
        
        # Log notification
        await db.reminder_notifications.insert_one({
            "reminder_id": str(reminder["_id"]),
            "user_id": reminder["user_id"],
            "medicine_name": medicine_name,
            "scheduled_time": scheduled_time.isoformat(),
            "sent_at": datetime.utcnow(),
            "channels": {
                "email": user.get("email") is not None,
                "sms": phone is not None
            }
        })
    
    def _format_email_html(
        self, 
        medicine_name: str, 
        dosage: str, 
        scheduled_time: time, 
        instructions: str,
        user_name: str
    ) -> str:
        """Format HTML email for medicine reminder"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        .medicine-box {{
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .detail {{
            margin: 10px 0;
        }}
        .label {{
            font-weight: bold;
            color: #667eea;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            color: #777;
            font-size: 14px;
        }}
        .emoji {{
            font-size: 24px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="emoji">🔔</span> Medicine Reminder</h1>
        </div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>This is a friendly reminder to take your medicine!</p>
            
            <div class="medicine-box">
                <div class="detail">
                    <span class="label">💊 Medicine:</span> {medicine_name}
                </div>
                <div class="detail">
                    <span class="label">📏 Dosage:</span> {dosage}
                </div>
                <div class="detail">
                    <span class="label">⏰ Time:</span> {scheduled_time.strftime('%I:%M %p')}
                </div>
                <div class="detail">
                    <span class="label">📝 Instructions:</span> {instructions}
                </div>
            </div>
            
            <p>Remember to take your medicine as prescribed to ensure effective treatment.</p>
            <p><strong>Stay healthy! 💪</strong></p>
            
            <div class="footer">
                <p>This is an automated reminder from MedAI Healthcare Platform</p>
                <p>If you have any questions, please consult your healthcare provider.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

# Global scheduler instance
reminder_scheduler = ReminderScheduler()

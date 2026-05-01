from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
from datetime import datetime, timedelta
from typing import List

class HealthAnalyticsService:
    def __init__(self):
        self.scaler = StandardScaler()
    
    async def analyze_health_data(self, logs: List[dict]) -> dict:
        """Analyze health data and provide trends and insights"""
        if not logs:
            return {
                "trends": {},
                "alerts": [],
                "recommendations": [],
                "risk_score": None
            }
        
        # Extract vital signs data
        dates = []
        blood_pressure_sys = []
        blood_pressure_dia = []
        heart_rates = []
        weights = []
        blood_sugars = []
        
        for log in logs:
            if log.get("vital_signs"):
                vs = log["vital_signs"]
                date = log.get("date") or log.get("created_at")
                
                if vs.get("blood_pressure_systolic"):
                    dates.append(date)
                    blood_pressure_sys.append(vs["blood_pressure_systolic"])
                    blood_pressure_dia.append(vs.get("blood_pressure_diastolic", 0))
                
                if vs.get("heart_rate"):
                    heart_rates.append(vs["heart_rate"])
                
                if vs.get("weight"):
                    weights.append(vs["weight"])
                
                if vs.get("blood_sugar"):
                    blood_sugars.append(vs["blood_sugar"])
        
        # Calculate trends
        trends = {}
        
        if blood_pressure_sys:
            trends["blood_pressure"] = {
                "average_systolic": round(np.mean(blood_pressure_sys), 1),
                "average_diastolic": round(np.mean(blood_pressure_dia), 1),
                "trend": self._calculate_trend(blood_pressure_sys),
                "status": self._assess_blood_pressure(
                    np.mean(blood_pressure_sys),
                    np.mean(blood_pressure_dia)
                )
            }
        
        if heart_rates:
            trends["heart_rate"] = {
                "average": round(np.mean(heart_rates), 1),
                "min": int(np.min(heart_rates)),
                "max": int(np.max(heart_rates)),
                "trend": self._calculate_trend(heart_rates)
            }
        
        if weights:
            trends["weight"] = {
                "current": round(weights[-1], 1),
                "change": round(weights[-1] - weights[0], 1) if len(weights) > 1 else 0,
                "trend": self._calculate_trend(weights)
            }
        
        if blood_sugars:
            trends["blood_sugar"] = {
                "average": round(np.mean(blood_sugars), 1),
                "trend": self._calculate_trend(blood_sugars),
                "status": self._assess_blood_sugar(np.mean(blood_sugars))
            }
        
        # Generate alerts
        alerts = self._generate_alerts(trends)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(trends, logs)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(trends)
        
        return {
            "trends": trends,
            "alerts": alerts,
            "recommendations": recommendations,
            "risk_score": round(risk_score, 2)
        }
    
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        if len(values) < 2:
            return "stable"
        
        # Simple linear regression
        X = np.array(range(len(values))).reshape(-1, 1)
        y = np.array(values)
        
        model = LinearRegression()
        model.fit(X, y)
        
        slope = model.coef_[0]
        
        if abs(slope) < 0.1:
            return "stable"
        elif slope > 0:
            return "increasing"
        else:
            return "decreasing"
    
    def _assess_blood_pressure(self, systolic: float, diastolic: float) -> str:
        """Assess blood pressure status"""
        if systolic < 120 and diastolic < 80:
            return "normal"
        elif systolic < 130 and diastolic < 80:
            return "elevated"
        elif systolic < 140 or diastolic < 90:
            return "high_stage_1"
        else:
            return "high_stage_2"
    
    def _assess_blood_sugar(self, blood_sugar: float) -> str:
        """Assess blood sugar status"""
        if blood_sugar < 100:
            return "normal"
        elif blood_sugar < 126:
            return "prediabetic"
        else:
            return "diabetic_range"
    
    def _generate_alerts(self, trends: dict) -> List[str]:
        """Generate health alerts"""
        alerts = []
        
        if "blood_pressure" in trends:
            bp = trends["blood_pressure"]
            if bp["status"] in ["high_stage_1", "high_stage_2"]:
                alerts.append(f"⚠️ Blood pressure is {bp['status'].replace('_', ' ')}")
        
        if "blood_sugar" in trends:
            bs = trends["blood_sugar"]
            if bs["status"] != "normal":
                alerts.append(f"⚠️ Blood sugar is in {bs['status'].replace('_', ' ')}")
        
        if "heart_rate" in trends:
            hr = trends["heart_rate"]
            if hr["average"] > 100:
                alerts.append("⚠️ Average heart rate is elevated")
            elif hr["average"] < 60:
                alerts.append("⚠️ Average heart rate is low")
        
        return alerts
    
    def _generate_recommendations(self, trends: dict, logs: List[dict]) -> List[str]:
        """Generate health recommendations"""
        recommendations = []
        
        if "blood_pressure" in trends:
            bp = trends["blood_pressure"]
            if bp["status"] != "normal":
                recommendations.append("💡 Monitor your sodium intake and maintain regular exercise")
                recommendations.append("💡 Consider consulting with a healthcare provider about your blood pressure")
        
        if "weight" in trends:
            weight = trends["weight"]
            if weight["trend"] == "increasing" and weight["change"] > 5:
                recommendations.append("💡 Consider reviewing your diet and exercise routine")
        
        if "blood_sugar" in trends:
            bs = trends["blood_sugar"]
            if bs["status"] != "normal":
                recommendations.append("💡 Monitor carbohydrate intake and consider regular blood sugar checks")
        
        # General recommendations
        recommendations.append("💡 Maintain regular health check-ups")
        recommendations.append("💡 Stay hydrated and get adequate sleep")
        
        return recommendations
    
    def _calculate_risk_score(self, trends: dict) -> float:
        """Calculate overall health risk score (0-10)"""
        risk = 0.0
        factors = 0
        
        if "blood_pressure" in trends:
            factors += 1
            bp_status = trends["blood_pressure"]["status"]
            if bp_status == "elevated":
                risk += 3
            elif bp_status == "high_stage_1":
                risk += 5
            elif bp_status == "high_stage_2":
                risk += 8
        
        if "blood_sugar" in trends:
            factors += 1
            bs_status = trends["blood_sugar"]["status"]
            if bs_status == "prediabetic":
                risk += 4
            elif bs_status == "diabetic_range":
                risk += 7
        
        if "heart_rate" in trends:
            factors += 1
            hr_avg = trends["heart_rate"]["average"]
            if hr_avg > 100 or hr_avg < 60:
                risk += 3
        
        if factors == 0:
            return 1.0  # Low risk by default
        
        return min(risk / factors, 10.0)

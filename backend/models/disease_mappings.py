"""
Disease to Doctor Specialty Mappings
Maps predicted diseases to appropriate medical specialists and treatment recommendations
"""

from typing import Dict


# Disease to doctor specialty mapping
DISEASE_TO_DOCTOR = {
    "Acne": {
        "specialty": "Dermatologist",
        "urgency": "routine",
        "consultation_type": "in-person or telemedicine",
        "description": "Dermatologists specialize in treating skin conditions including acne"
    },
    "Eczema": {
        "specialty": "Dermatologist",
        "urgency": "routine",
        "consultation_type": "in-person recommended",
        "description": "Dermatologists can diagnose and treat various forms of eczema"
    },
    "Melanoma": {
        "specialty": "Dermatologist (urgent referral to Oncologist if confirmed)",
        "urgency": "urgent",
        "consultation_type": "in-person immediately",
        "description": "Melanoma requires immediate evaluation by a dermatologist and possible oncology referral"
    },
    "Psoriasis": {
        "specialty": "Dermatologist",
        "urgency": "soon",
        "consultation_type": "in-person recommended",
        "description": "Dermatologists specialize in managing chronic skin conditions like psoriasis"
    },
    "Vitiligo": {
        "specialty": "Dermatologist",
        "urgency": "routine",
        "consultation_type": "in-person or telemedicine",
        "description": "Dermatologists can help manage vitiligo and discuss treatment options"
    },
    "Rosacea": {
        "specialty": "Dermatologist",
        "urgency": "routine",
        "consultation_type": "in-person or telemedicine",
        "description": "Dermatologists can diagnose and manage rosacea symptoms"
    },
    "Normal": {
        "specialty": "General Practitioner (routine checkup)",
        "urgency": "none",
        "consultation_type": "routine checkup or telemedicine",
        "description": "No specific skin condition detected. Routine checkup recommended for overall health"
    }
}


# Treatment recommendations by disease
DISEASE_TREATMENTS = {
    "Acne": {
        "medications": [
            "Topical retinoids (tretinoin, adapalene)",
            "Benzoyl peroxide",
            "Topical antibiotics (clindamycin)",
            "Oral antibiotics (if moderate-severe)",
            "Isotretinoin (for severe cases)"
        ],
        "lifestyle": [
            "Wash face twice daily with gentle cleanser",
            "Avoid touching or picking at acne",
            "Use oil-free, non-comedogenic products",
            "Manage stress levels",
            "Stay hydrated"
        ],
        "next_steps": [
            "Consult dermatologist for proper diagnosis",
            "May need prescription medication",
            "Consider diet modifications (reduce dairy, high-glycemic foods)",
            "Regular follow-ups to monitor progress"
        ]
    },
    "Eczema": {
        "medications": [
            "Topical corticosteroids",
            "Moisturizers and emollients",
            "Topical calcineurin inhibitors",
            "Antihistamines for itching",
            "Biologic medications (severe cases)"
        ],
        "lifestyle": [
            "Use fragrance-free, hypoallergenic products",
            "Take lukewarm baths, avoid hot water",
            "Apply moisturizer immediately after bathing",
            "Identify and avoid triggers",
            "Wear soft, breathable fabrics"
        ],
        "next_steps": [
            "See dermatologist for diagnosis and treatment plan",
            "Patch testing to identify allergens",
            "Develop a consistent skincare routine",
            "Consider stress management techniques"
        ]
    },
    "Melanoma": {
        "medications": [
            "⚠️ URGENT: Requires immediate medical evaluation",
            "Surgical removal (primary treatment)",
            "Immunotherapy (for advanced cases)",
            "Targeted therapy",
            "Radiation therapy (if needed)"
        ],
        "lifestyle": [
            "IMMEDIATE CONSULTATION REQUIRED",
            "Avoid further sun exposure",
            "Use broad-spectrum SPF 50+ sunscreen daily",
            "Perform monthly skin self-examinations",
            "Schedule regular dermatology checkups"
        ],
        "next_steps": [
            "⚠️ SEEK IMMEDIATE DERMATOLOGIST CONSULTATION",
            "Biopsy to confirm diagnosis",
            "Staging if melanoma is confirmed",
            "Referral to oncologist if needed",
            "Family members should also get skin checks"
        ]
    },
    "Psoriasis": {
        "medications": [
            "Topical corticosteroids",
            "Vitamin D analogs (calcipotriene)",
            "Topical retinoids",
            "Phototherapy (light therapy)",
            "Systemic medications (methotrexate, cyclosporine)",
            "Biologic drugs (for moderate-severe)"
        ],
        "lifestyle": [
            "Keep skin moisturized",
            "Avoid triggers (stress, alcohol, smoking)",
            "Take short, lukewarm showers",
            "Use gentle, fragrance-free products",
            "Manage stress through meditation/yoga"
        ],
        "next_steps": [
            "Consult dermatologist for treatment plan",
            "May need combination therapy",
            "Regular monitoring and follow-ups",
            "Consider joining support groups",
            "Screen for psoriatic arthritis"
        ]
    },
    "Vitiligo": {
        "medications": [
            "Topical corticosteroids",
            "Topical calcineurin inhibitors",
            "Phototherapy (narrowband UVB)",
            "Excimer laser therapy",
            "Depigmentation (extensive cases)",
            "JAK inhibitors (ruxolitinib - newer treatment)"
        ],
        "lifestyle": [
            "Use sunscreen on all skin (SPF 30+)",
            "Protect depigmented areas from sun",
            "Cosmetic camouflage if desired",
            "Manage psychological impact",
            "Avoid skin trauma (Koebner phenomenon)"
        ],
        "next_steps": [
            "See dermatologist to confirm diagnosis",
            "Discuss treatment options based on extent",
            "Consider counseling for psychological support",
            "Regular follow-ups to monitor progression",
            "May stabilize or repigment with treatment"
        ]
    },
    "Rosacea": {
        "medications": [
            "Topical metronidazole",
            "Topical azelaic acid",
            "Oral antibiotics (doxycycline)",
            "Topical ivermectin",
            "Brimonidine (for redness)",
            "Laser/light therapy for visible blood vessels"
        ],
        "lifestyle": [
            "Identify and avoid triggers (spicy food, alcohol, hot drinks)",
            "Use gentle, non-irritating skincare",
            "Protect skin from sun and wind",
            "Manage stress levels",
            "Avoid hot showers and baths"
        ],
        "next_steps": [
            "Consult dermatologist for proper diagnosis",
            "Keep diary to identify triggers",
            "Develop long-term management plan",
            "Regular follow-ups to adjust treatment",
            "Consider dietary modifications"
        ]
    },
    "Normal": {
        "medications": [
            "No specific medication needed",
            "Continue routine skincare",
            "Use sunscreen daily (SPF 30+)"
        ],
        "lifestyle": [
            "Maintain healthy skincare routine",
            "Use gentle, pH-balanced cleanser",
            "Moisturize regularly",
            "Stay hydrated",
            "Eat balanced diet rich in antioxidants"
        ],
        "next_steps": [
            "Routine annual skin check recommended",
            "Monitor for any changes in skin",
            "Continue sun protection",
            "Maintain overall healthy lifestyle"
        ]
    }
}


# Disease information for context
DISEASE_INFO = {
    "Acne": {
        "medical_name": "Acne Vulgaris",
        "description": "Common skin condition causing pimples, blackheads, and inflammation, typically on face, chest, and back",
        "common_age": "Teenagers and young adults (can occur at any age)",
        "prevalence": "Very common - affects 80% of people aged 11-30",
        "causes": "Excess oil production, clogged pores, bacteria, inflammation, hormones"
    },
    "Eczema": {
        "medical_name": "Atopic Dermatitis",
        "description": "Chronic inflammatory skin condition causing itchy, red, dry patches",
        "common_age": "Often begins in childhood, can persist or develop in adults",
        "prevalence": "Common - affects 15-20% of children, 1-3% of adults",
        "causes": "Genetic factors, immune system dysfunction, environmental triggers, skin barrier defects"
    },
    "Melanoma": {
        "medical_name": "Malignant Melanoma",
        "description": "Most serious type of skin cancer developing in melanocytes (pigment cells)",
        "common_age": "Can occur at any age, risk increases with age",
        "prevalence": "Less common but most dangerous skin cancer",
        "causes": "UV radiation exposure, genetic factors, fair skin, many moles, family history"
    },
    "Psoriasis": {
        "medical_name": "Psoriasis Vulgaris",
        "description": "Chronic autoimmune condition causing rapid skin cell buildup, forming thick silvery scales and red patches",
        "common_age": "Can develop at any age, peaks at 15-35 and 50-60",
        "prevalence": "Common - affects 2-3% of population",
        "causes": "Autoimmune disorder, genetic factors, triggered by stress, infections, medications"
    },
    "Vitiligo": {
        "medical_name": "Vitiligo",
        "description": "Condition causing loss of skin pigmentation in patches due to melanocyte destruction",
        "common_age": "Often begins before age 30",
        "prevalence": "Affects 0.5-2% of population, all skin types",
        "causes": "Autoimmune destruction of melanocytes, genetic factors, possible triggers"
    },
    "Rosacea": {
        "medical_name": "Rosacea",
        "description": "Chronic inflammatory skin condition causing facial redness, visible blood vessels, and sometimes acne-like bumps",
        "common_age": "Typically starts after age 30, peaks at 40-60",
        "prevalence": "Common - affects 5-10% of population",
        "causes": "Unknown exact cause, genetic factors, immune system, environmental triggers"
    },
    "Normal": {
        "medical_name": "Healthy Skin",
        "description": "No significant skin condition detected",
        "common_age": "N/A",
        "prevalence": "N/A",
        "causes": "N/A"
    }
}


DISEASE_TESTS = {
    "Acne": [
        "Clinical skin examination",
        "Dermoscopy if diagnosis is uncertain",
        "Hormonal evaluation if severe or persistent",
    ],
    "Eczema": [
        "Clinical examination",
        "Patch testing if allergic trigger is suspected",
        "Skin biopsy if presentation is atypical",
    ],
    "Melanoma": [
        "Urgent dermoscopy",
        "Skin biopsy for histopathology",
        "Sentinel node evaluation if confirmed",
    ],
    "Psoriasis": [
        "Clinical examination",
        "Skin biopsy if the diagnosis is uncertain",
        "Screening for psoriatic arthritis if joint pain is present",
    ],
    "Vitiligo": [
        "Clinical examination",
        "Wood lamp examination",
        "Autoimmune screening if clinically indicated",
    ],
    "Rosacea": [
        "Clinical examination",
        "Dermatoscopy if needed",
        "Ocular assessment if eye symptoms are present",
    ],
    "Normal": [
        "Routine skin check",
        "Dermatology review if symptoms develop",
    ],
}


MODALITY_DEFAULTS = {
    "skin": {
        "doctor": {
            "specialty": "Dermatologist",
            "urgency": "routine",
            "consultation_type": "in-person or telemedicine",
            "description": "Dermatologist evaluation is recommended for skin findings.",
        },
        "tests": [
            "Clinical skin examination",
            "Dermoscopy for lesion review",
            "Biopsy if the lesion is suspicious or atypical",
        ],
        "treatment": {
            "medications": [
                "Use treatment only after dermatologist confirmation",
                "Avoid self-medicating with potent topical steroids",
            ],
            "lifestyle": [
                "Protect skin from sun exposure",
                "Avoid known irritants and allergens",
            ],
            "next_steps": [
                "Schedule a dermatology consultation",
                "Track symptoms and image progression over time",
            ],
        },
        "info": {
            "medical_name": "Unspecified Skin Condition",
            "description": "AI detected a skin pattern not mapped to a curated condition profile.",
            "common_age": "Varies",
            "prevalence": "Varies",
            "causes": "Requires clinical evaluation",
        },
    },
    "chest": {
        "doctor": {
            "specialty": "Pulmonologist or Radiologist",
            "urgency": "soon",
            "consultation_type": "in-person recommended",
            "description": "Chest imaging findings should be reviewed by a pulmonology/radiology specialist.",
        },
        "tests": [
            "Chest X-ray review",
            "CT chest if the finding needs further characterization",
            "Pulse oximetry and basic labs as clinically indicated",
        ],
        "treatment": {
            "medications": [
                "Medication depends on confirmed chest diagnosis",
                "Avoid antibiotics or steroids without physician guidance",
            ],
            "lifestyle": [
                "Monitor breathing symptoms and oxygen saturation",
                "Avoid smoking and respiratory irritants",
            ],
            "next_steps": [
                "Consult pulmonology for interpretation",
                "Consider confirmatory imaging and laboratory tests",
            ],
        },
        "info": {
            "medical_name": "Unspecified Thoracic Finding",
            "description": "AI detected a chest imaging pattern requiring clinical correlation.",
            "common_age": "Varies",
            "prevalence": "Varies",
            "causes": "Infectious, inflammatory, structural, or cardiac causes",
        },
    },
    "eye": {
        "doctor": {
            "specialty": "Ophthalmologist",
            "urgency": "soon",
            "consultation_type": "in-person recommended",
            "description": "Eye imaging findings require ophthalmology confirmation.",
        },
        "tests": [
            "Dilated fundus examination",
            "Optical coherence tomography (OCT)",
            "Visual acuity and intraocular pressure assessment",
        ],
        "treatment": {
            "medications": [
                "Medication varies by confirmed ocular diagnosis",
                "Do not use steroid eye drops without prescription",
            ],
            "lifestyle": [
                "Control diabetes and blood pressure where relevant",
                "Avoid eye strain and maintain follow-up exams",
            ],
            "next_steps": [
                "Book ophthalmology evaluation",
                "Perform detailed retinal/optic nerve examination",
            ],
        },
        "info": {
            "medical_name": "Unspecified Ocular Finding",
            "description": "AI detected an eye imaging pattern requiring specialist assessment.",
            "common_age": "Varies",
            "prevalence": "Varies",
            "causes": "Retinal, lens, optic nerve, or vascular etiologies",
        },
    },
    "brain": {
        "doctor": {
            "specialty": "Neurologist or Neurosurgeon",
            "urgency": "urgent",
            "consultation_type": "in-person immediately",
            "description": "Brain imaging findings should be reviewed urgently by neurology/neurosurgery teams.",
        },
        "tests": [
            "MRI or CT with contrast if indicated",
            "Neurological examination",
            "Emergency lab work if acute neurological symptoms are present",
        ],
        "treatment": {
            "medications": [
                "Treatment depends on MRI/CT-confirmed diagnosis",
                "Do not delay emergency care for acute neurological symptoms",
            ],
            "lifestyle": [
                "Seek immediate care for severe headache, weakness, seizures, or confusion",
                "Avoid delaying specialist consultation",
            ],
            "next_steps": [
                "Obtain urgent neurological evaluation",
                "Confirm findings with radiology and multidisciplinary review",
            ],
        },
        "info": {
            "medical_name": "Unspecified Intracranial Finding",
            "description": "AI detected a brain imaging pattern requiring urgent specialist confirmation.",
            "common_age": "Varies",
            "prevalence": "Varies",
            "causes": "Neoplastic, vascular, infectious, or inflammatory causes",
        },
    },
}


def get_doctor_recommendation(disease: str, modality: str = "skin") -> Dict:
    """
    Get doctor specialty recommendation for a disease
    
    Args:
        disease: Disease name
        
    Returns:
        Dictionary with doctor information
    """
    if disease in DISEASE_TO_DOCTOR:
        return DISEASE_TO_DOCTOR[disease]

    modality_defaults = MODALITY_DEFAULTS.get(modality, MODALITY_DEFAULTS["skin"])
    return modality_defaults["doctor"]


def get_treatment_recommendations(disease: str, modality: str = "skin") -> Dict:
    """
    Get treatment recommendations for a disease
    
    Args:
        disease: Disease name
        
    Returns:
        Dictionary with treatment information
    """
    if disease in DISEASE_TREATMENTS:
        return DISEASE_TREATMENTS[disease]

    modality_defaults = MODALITY_DEFAULTS.get(modality, MODALITY_DEFAULTS["skin"])
    return modality_defaults["treatment"]


def get_disease_info(disease: str, modality: str = "skin") -> Dict:
    """
    Get general information about a disease
    
    Args:
        disease: Disease name
        
    Returns:
        Dictionary with disease information
    """
    if disease in DISEASE_INFO:
        return DISEASE_INFO[disease]

    modality_defaults = MODALITY_DEFAULTS.get(modality, MODALITY_DEFAULTS["skin"])
    info = dict(modality_defaults["info"])
    info["medical_name"] = disease
    return info


def get_full_disease_context(disease: str, confidence: float, modality: str = "skin") -> Dict:
    """
    Get complete context for a disease including doctor, treatment, and info
    
    Args:
        disease: Disease name
        confidence: Prediction confidence (0-1)
        
    Returns:
        Comprehensive dictionary with all disease information
    """
    doctor_info = get_doctor_recommendation(disease, modality=modality)
    treatment_info = get_treatment_recommendations(disease, modality=modality)
    disease_details = get_disease_info(disease, modality=modality)
    test_recommendations = DISEASE_TESTS.get(disease)

    if not test_recommendations:
        test_recommendations = MODALITY_DEFAULTS.get(modality, MODALITY_DEFAULTS["skin"]).get("tests", [])
    
    # Adjust urgency based on confidence
    urgency = doctor_info["urgency"]
    if confidence < 0.7 and urgency == "urgent":
        urgency = "soon"  # Lower urgency if confidence is low
    
    return {
        "disease": disease,
        "modality": modality,
        "confidence": confidence,
        "doctor": {
            "specialty": doctor_info["specialty"],
            "urgency": urgency,
            "consultation_type": doctor_info["consultation_type"],
            "description": doctor_info["description"]
        },
        "treatment": {
            "medications": treatment_info["medications"],
            "lifestyle": treatment_info["lifestyle"],
            "next_steps": treatment_info["next_steps"]
        },
        "tests": test_recommendations,
        "disease_info": disease_details
    }

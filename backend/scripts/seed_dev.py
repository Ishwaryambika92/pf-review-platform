"""
DEV-ONLY fixture data. Creates service categories/services with zero
reviews. Deliberately does NOT create any Review rows — real reviews
must come from the actual submission flow so ratings/verification are
never faked. Run with: python manage.py shell < scripts/seed_dev.py
"""
from services.models import Service, ServiceCategory

categories = [
    ("PF Withdrawal", "Assistance with EPF withdrawal claims and Form 19/10C."),
    ("PF Transfer", "Help transferring PF balance between employers via Form 13."),
    ("UAN Services", "UAN activation, linking and correction assistance."),
    ("KYC Services", "e-KYC updates for Aadhaar, PAN and bank details on EPFO."),
    ("PF Grievance Assistance", "Support raising and tracking EPFiGMS grievances."),
]

for name, desc in categories:
    cat, _ = ServiceCategory.objects.get_or_create(name=name, defaults={"description": desc})
    Service.objects.get_or_create(
        category=cat,
        name=f"{name} Support Desk",
        defaults={
            "description": f"Guided {name.lower()} support with document checklists and status tracking.",
            "process_info": "Submit request -> document check -> processing -> confirmation.",
            "common_requirements": "UAN, Aadhaar-linked mobile number, bank passbook copy.",
        },
    )

print(f"Seeded {ServiceCategory.objects.count()} categories, {Service.objects.count()} services (0 reviews).")

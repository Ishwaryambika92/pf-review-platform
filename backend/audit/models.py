import uuid

from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Immutable trail of moderation-relevant actions. Written by signal
    handlers / views — never editable through the API.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="audit_actions",
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=100)
    target_id = models.CharField(max_length=64)
    meta = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self):
        return f"{self.action} on {self.target_type}:{self.target_id} by {self.actor_id}"

    @classmethod
    def record(cls, *, actor, action, target, meta=None):
        return cls.objects.create(
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            action=action,
            target_type=target.__class__.__name__,
            target_id=str(target.pk),
            meta=meta or {},
        )

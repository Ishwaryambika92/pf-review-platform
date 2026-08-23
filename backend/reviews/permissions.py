from rest_framework import permissions


class ReviewAccessPermission(permissions.BasePermission):
    """
    - Anyone (including logged-out visitors) can list/retrieve public
      reviews and create new ones — this platform never requires an
      account to browse or submit a review.
    - Only staff/moderators can edit or delete a review directly through
      this API (customers never edit after submission; there's no
      account-based ownership to check for anonymous submissions).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS or request.method == "POST":
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_moderator))

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_moderator))


class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_moderator)
        )

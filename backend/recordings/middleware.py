# recordings/middleware.py

# THIS MIDDLEWARE IS NO LONGER NEEDED - We use a custom view instead
# You can delete this file or leave it empty

class AddAcceptRangesHeaderMiddleware:
    """
    This middleware is disabled. Range requests are now handled by serve_recording view.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
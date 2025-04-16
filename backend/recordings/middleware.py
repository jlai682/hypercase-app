# your_app/middleware.py
class AddAcceptRangesHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Only add to audio responses
        if response.get('Content-Type', '').startswith('audio/'):
            response['Accept-Ranges'] = 'bytes'
        return response

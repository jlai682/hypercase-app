# your_app/middleware.py
class AddAcceptRangesHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
            response = self.get_response(request)
            if request.path.startswith('/media/'):
                response['Accept-Ranges'] = 'bytes'
            return response
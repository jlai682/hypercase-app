# recordings/middleware.py

class AddAcceptRangesHeaderMiddleware:
    """
    Middleware to forcefully add CORS and Accept-Ranges headers for media files.
    This ensures audio/video playback works in mobile apps.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle OPTIONS preflight requests for media
        if request.method == 'OPTIONS' and request.path.startswith('/media/'):
            from django.http import HttpResponse
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range, Accept, Accept-Encoding, Authorization'
            response['Access-Control-Max-Age'] = '86400'
            return response
        
        response = self.get_response(request)
        
        # Force CORS headers on ALL media file responses
        if request.path.startswith('/media/'):
            # Override any existing headers to ensure they're set correctly
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range, Accept, Accept-Encoding, Authorization'
            response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges, Content-Type'
            response['Accept-Ranges'] = 'bytes'
            
            # Ensure content type is set correctly for m4a files
            if request.path.endswith('.m4a'):
                response['Content-Type'] = 'audio/mp4'
                
        return response
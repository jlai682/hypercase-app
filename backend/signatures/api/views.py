from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignatureSerializer
from ..models import Signature
from patientManagement.models import Patient


class SignatureViewSet(ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer

    def create(self, request, *args, **kwargs):
        # Add logic to handle patient_id if present in the request
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['GET'])
    def by_patient(self, request):
        """Get signature for a specific patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response(
                {"error": "patient_id query parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            signature = Signature.objects.get(patient_id=patient_id)
            serializer = self.get_serializer(signature)
            return Response(serializer.data)
        except Signature.DoesNotExist:
            return Response(
                {"error": "No signature found for this patient"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['POST'])
    def for_patient(self, request):
        """Create or update signature for a specific patient"""
        patient_id = request.data.get('patient_id')
        if not patient_id:
            return Response(
                {"error": "patient_id is required in request data"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate required fields
        if not request.data.get('is_checked'):
            return Response(
                {"error": "is_checked field must be true to indicate consent"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.data.get('digital_signature'):
            return Response(
                {"error": "digital_signature is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.data.get('date'):
            return Response(
                {"error": "date is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Convert patient_id to integer if it's a string
            try:
                patient_id = int(patient_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": f"Invalid patient_id format: {patient_id}. Must be an integer."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if patient exists
            try:
                patient = Patient.objects.get(id=patient_id)
            except Patient.DoesNotExist:
                return Response(
                    {"error": f"Patient with id {patient_id} does not exist"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if signature exists for this patient
            signature, created = Signature.objects.get_or_create(
                patient=patient,
                defaults={
                    'is_checked': request.data.get('is_checked', False),
                    'digital_signature': request.data.get('digital_signature', ''),
                    'date': request.data.get('date')
                }
            )
            
            if not created:
                # Update existing signature
                signature.is_checked = request.data.get('is_checked', signature.is_checked)
                signature.digital_signature = request.data.get('digital_signature', signature.digital_signature)
                if 'date' in request.data:
                    signature.date = request.data.get('date')
                signature.save()
                
            serializer = self.get_serializer(signature)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response(
                {"error": f"Error processing request: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

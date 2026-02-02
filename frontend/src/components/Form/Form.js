import { useState, useRef, useCallback } from 'react';
import { Box, TextField, Button, IconButton, CircularProgress, Typography } from '@mui/material';
import { PhotoCamera, Replay } from '@mui/icons-material';
import Webcam from 'react-webcam';
import './Form.css';

const Form = () => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhoto(imageSrc);
      }
    }
  }, [webcamRef]);

  const handleStartChat = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="form-card">
      <Typography className="flow-label">AI GENDER CLASSIFICATION</Typography>
      
      <Box className="webcam-container" sx={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
        {cameraError && (
          <Typography color="error" sx={{ position: 'absolute', top: 10, zIndex: 20, width: '100%', textAlign: 'center' }}>
            Camera Error: {cameraError}
          </Typography>
        )}

        {!photo ? (
          <>
            <Webcam 
              audio={false} 
              ref={webcamRef} 
              screenshotFormat="image/jpeg" 
              videoConstraints={videoConstraints}
              mirrored={true} 
              className="cam-view"
              onUserMediaError={(err) => setCameraError(err.toString())}
              onUserMedia={() => setCameraError(null)}
              style={{ width: '100%', display: 'block' }}
            />
            <IconButton 
              onClick={capture} 
              disabled={!!cameraError}
              sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': { backgroundColor: '#fff' },
                boxShadow: 3
              }}
            >
              <PhotoCamera sx={{ fontSize: 32, color: '#000' }} />
            </IconButton>
          </>
        ) : (
          <>
            <img src={photo} alt="Verified Selfie" className="cam-view" style={{ width: '100%', display: 'block' }} />
            <IconButton 
              onClick={() => setPhoto(null)} 
              sx={{ 
                position: 'absolute', 
                bottom: 16, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': { backgroundColor: '#fff' },
                boxShadow: 3
              }}
            >
              <Replay sx={{ fontSize: 32, color: '#000' }} />
            </IconButton>
          </>
        )}
      </Box>

      <TextField fullWidth placeholder="Pseudonym Nickname" variant="standard" className="mui-input" sx={{ mt: 2 }} InputProps={{ disableUnderline: true }} />
      <TextField fullWidth placeholder="Short Bio (1-2 lines)" multiline rows={2} variant="standard" className="mui-input" sx={{ mt: 1 }} InputProps={{ disableUnderline: true }} />

      <Button 
        fullWidth 
        className="btn-join" 
        onClick={handleStartChat}
        disabled={!photo || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'START CHAT'}
      </Button>
      <Typography className="security-note" sx={{ textAlign: 'center', mt: 1 }}>Images are never stored.</Typography>
    </Box>
  );
};

export default Form;
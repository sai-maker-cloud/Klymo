import { Typography, Box } from '@mui/material';
import { Shield } from '@mui/icons-material';
import './Hero.css';

const Hero = () => {
  return (
    <Box className="hero-content">
      <div className="trust-badge">
        <Shield sx={{ fontSize: 16, mr: 1 }} />
        <span>KLYMO • VERIFIED SAFETY</span>
      </div>
      <Typography variant="h1" className="hero-title">
        Real <span className="gradient-highlight">Vibe.</span> <br/> Zero Trace.
      </Typography>
      <Typography className="hero-description">
        The only ephemeral chat that uses AI to stop catfishing while keeping your identity 100% private.
      </Typography>
    </Box>
  );
};

export default Hero;
import { Box, Avatar, AvatarGroup, Typography } from '@mui/material';
import './UsersJoined.css';

const UsersJoined = () => {
  return (
    <Box className="proof-container">
      <Typography className="proof-header">LIVE QUEUE</Typography>
      <Box className="avatar-row">
        <AvatarGroup max={5} className="mui-avatar-group">
          <Avatar src="https://i.pravatar.cc/100?u=1" />
          <Avatar src="https://i.pravatar.cc/100?u=2" />
          <Avatar src="https://i.pravatar.cc/100?u=3" />
          <Avatar sx={{ bgcolor: '#6366f1' }}>+84</Avatar>
        </AvatarGroup>
        <Typography className="proof-text">verified users chatting right now</Typography>
      </Box>
    </Box>
  );
};

export default UsersJoined;
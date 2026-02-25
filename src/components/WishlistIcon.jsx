import { useNavigate } from 'react-router-dom';
import { IconButton, Badge, Tooltip } from '@mui/material';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistIcon() {
  const navigate = useNavigate();
  const { getWishlistCount } = useWishlist();
  const count = getWishlistCount();

  return (
    <Tooltip title="Wishlist" arrow>
      <IconButton
        onClick={() => navigate('/account#wishlist')}
        sx={{
          color: '#E91E8C',
          '&:hover': { color: '#4A0E4E' },
        }}
      >
        <Badge
          badgeContent={count}
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#E91E8C',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              minWidth: 18,
              height: 18,
            },
          }}
        >
          <FavoriteBorderOutlinedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

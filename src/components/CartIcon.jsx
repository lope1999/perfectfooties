import { useNavigate } from 'react-router-dom';
import { IconButton, Badge, Tooltip } from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '../context/CartContext';

export default function CartIcon() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const count = getCartCount();

  return (
    <Tooltip title="View Cart" arrow>
      <IconButton
        onClick={() => navigate('/cart')}
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
          <ShoppingCartOutlinedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

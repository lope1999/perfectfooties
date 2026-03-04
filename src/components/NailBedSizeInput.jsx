import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Collapse,
  Grid,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const fingers = [
  { key: 'RT', label: 'Thumb', hand: 'Right' },
  { key: 'RI', label: 'Index', hand: 'Right' },
  { key: 'RM', label: 'Middle', hand: 'Right' },
  { key: 'RR', label: 'Ring', hand: 'Right' },
  { key: 'RP', label: 'Pinky', hand: 'Right' },
  { key: 'LT', label: 'Thumb', hand: 'Left' },
  { key: 'LI', label: 'Index', hand: 'Left' },
  { key: 'LM', label: 'Middle', hand: 'Left' },
  { key: 'LR', label: 'Ring', hand: 'Left' },
  { key: 'LP', label: 'Pinky', hand: 'Left' },
];

const rightFingers = fingers.filter((f) => f.hand === 'Right');
const leftFingers = fingers.filter((f) => f.hand === 'Left');

export default function NailBedSizeInput({ value, onChange, required }) {
  const [open, setOpen] = useState(false);

  // Parse value string like "RT:18, RI:15" into object { RT: '18', RI: '15' }
  const parseValues = (str) => {
    if (!str) return {};
    const obj = {};
    str.split(',').forEach((part) => {
      const [key, val] = part.trim().split(':');
      if (key && val) obj[key.trim()] = val.trim();
    });
    return obj;
  };

  const sizes = parseValues(value);

  const handleFingerChange = (key, mm) => {
    const updated = { ...sizes };
    if (mm) {
      updated[key] = mm;
    } else {
      delete updated[key];
    }
    // Build string from all fingers in order
    const parts = fingers
      .filter((f) => updated[f.key])
      .map((f) => `${f.key}:${updated[f.key]}`);
    onChange(parts.join(', '));
  };

  const filledCount = Object.keys(sizes).length;
  const isComplete = filledCount === 10;
  const showError = required && !isComplete && !open;
  const displayText = filledCount > 0
    ? `${filledCount}/10 sizes entered${required && !isComplete ? ' (all 10 required)' : ''}`
    : required ? 'Required — tap to enter all 10 nail sizes' : 'Tap to enter nail sizes';

  const renderHand = (handFingers, handLabel) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontFamily: '"Georgia", serif',
          fontWeight: 700,
          fontSize: '0.8rem',
          color: '#4A0E4E',
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {handLabel} Hand
      </Typography>
      <Grid container spacing={1}>
        {handFingers.map((finger) => (
          <Grid item xs={4} sm={2.4} key={finger.key}>
            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#888',
                  mb: 0.3,
                  fontFamily: '"Georgia", serif',
                }}
              >
                {finger.label}
              </Typography>
              <TextField
                size="small"
                placeholder="mm"
                value={sizes[finger.key] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  handleFingerChange(finger.key, val);
                }}
                inputProps={{
                  style: {
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    padding: '6px 4px',
                  },
                  inputMode: 'decimal',
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: sizes[finger.key] ? '#FFF0F5' : '#fff',
                    '& fieldset': {
                      borderColor: sizes[finger.key] ? '#E91E8C' : '#ddd',
                    },
                    '&:hover fieldset': {
                      borderColor: '#E91E8C',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#E91E8C',
                    },
                  },
                  width: '100%',
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: '#bbb',
                  mt: 0.2,
                  fontWeight: 600,
                }}
              >
                {finger.key}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
		<Box>
			{/* Clickable summary bar */}
			<Box
				onClick={() => setOpen(!open)}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					border: "1px solid",
					borderColor: showError ? "#d32f2f" : open ? "#E91E8C" : "#ccc",
					borderRadius: 2,
					px: 1.5,
					py: 1,
					cursor: "pointer",
					backgroundColor: filledCount > 0 ? "#FFF0F5" : "#fff",
					transition: "all 0.2s ease",
					"&:hover": {
						borderColor: "#E91E8C",
					},
				}}
			>
				<Box>
					<Typography
						sx={{
							fontSize: "0.75rem",
							color: "#666",
							fontFamily: '"Georgia", serif',
						}}
					>
						Nail Bed Sizes
					</Typography>
					<Typography
						sx={{
							fontSize: "0.85rem",
							color: showError
								? "#d32f2f"
								: filledCount > 0
									? "#E91E8C"
									: "#aaa",
							fontWeight: filledCount > 0 ? 600 : 400,
						}}
					>
						{displayText}
					</Typography>
				</Box>
				{open ? (
					<KeyboardArrowUpIcon sx={{ color: "#E91E8C" }} />
				) : (
					<KeyboardArrowDownIcon sx={{ color: "#999" }} />
				)}
			</Box>

			{/* Expandable finger inputs */}
			<Collapse in={open}>
				<Box
					sx={{
						mt: 1.5,
						p: 2,
						border: "1px solid #F0C0D0",
						borderRadius: 2,
						backgroundColor: "#fff",
					}}
				>
					<Typography
						sx={{
							fontSize: "0.75rem",
							color: "#E91E8C",
							mb: 2,
							lineHeight: 1.5,
						}}
					>
						Enter each nail width in mm — measured at the widest point of
						each nail bed with a taperule or ruler.
					</Typography>
					{renderHand(rightFingers, "Right")}
					{renderHand(leftFingers, "Left")}
				</Box>
			</Collapse>
		</Box>
  );
}

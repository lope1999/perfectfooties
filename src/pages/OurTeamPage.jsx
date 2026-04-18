import { Box, Typography, Container, Grid, Chip, Avatar } from '@mui/material';
import ScrollReveal from '../components/ScrollReveal';
import { teamMembers } from '../data/team';

const departmentColors = {
  Leadership: '#007a7a',
  Craft: '#b8860b',
  Design: '#b81b21',
  Marketing: '#880E4F',
};

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function OurTeamPage() {
  const ceo = teamMembers[0];
  const rest = teamMembers.slice(1);

  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-main)', mb: 1 }}
          >
            Meet Our Team
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              color: '#777',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              fontFamily: '"Georgia", serif',
              maxWidth: 550,
              mx: 'auto',
            }}
          >
            The people behind every handcrafted leather piece — each bringing skill,
            precision, and care to everything we make.
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured — CEO */}
        <ScrollReveal direction="up">
          <Box
            sx={{
              mb: 6,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
            }}
          >
            <Box
              component="img"
              src={ceo.photo}
              alt={ceo.name}
              sx={{
                width: { xs: '100%', md: '40%' },
                height: { xs: 320, md: 400 },
                objectFit: 'cover',
                objectPosition: 'top',
              }}
            />
            <Box sx={{ p: { xs: 3, md: 5 }, flex: 1 }}>
              <Chip
                label={ceo.department}
                size="small"
                sx={{
                  backgroundColor: departmentColors[ceo.department] || '#e3242b',
                  color: '#fff',
                  fontWeight: 600,
                  fontFamily: '"Georgia", serif',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                {ceo.name}
              </Typography>
              <Typography
                sx={{
                  color: '#e3242b',
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  mb: 2,
                }}
              >
                {ceo.role}
              </Typography>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.8 }}>
                {ceo.bio}
              </Typography>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Team Grid */}
        <Grid container spacing={4}>
          {rest.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <ScrollReveal direction="up" delay={index * 0.08}>
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
                    },
                  }}
                >
                  {/* Avatar area */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F5F0E8',
                    }}
                  >
                    {member.photo ? (
                      <Box
                        component="img"
                        src={member.photo}
                        alt={member.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 96,
                          height: 96,
                          bgcolor: departmentColors[member.department] || '#007a7a',
                          fontSize: '2rem',
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          border: '3px solid #E8D5B0',
                        }}
                      >
                        {getInitials(member.name)}
                      </Avatar>
                    )}
                  </Box>

                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Chip
                      label={member.department}
                      size="small"
                      sx={{
                        backgroundColor: departmentColors[member.department] || '#e3242b',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        fontFamily: '"Georgia", serif',
                        height: 24,
                        mb: 1.5,
                        alignSelf: 'flex-start',
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontSize: '1.15rem',
                        mb: 0.3,
                      }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#e3242b',
                        fontFamily: '"Georgia", serif',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        mb: 1.5,
                      }}
                    >
                      {member.role}
                    </Typography>
                    <Typography
                      sx={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, flex: 1 }}
                    >
                      {member.bio}
                    </Typography>
                  </Box>
                </Box>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

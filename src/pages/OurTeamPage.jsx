import { Box, Typography, Container, Grid, Chip } from '@mui/material';
import ScrollReveal from '../components/ScrollReveal';
import { teamMembers, departments } from '../data/team';

const departmentColors = {
  Leadership: '#4A0E4E',
  Stylists: '#E91E8C',
  Design: '#C2185B',
  Marketing: '#880E4F',
};

export default function OurTeamPage() {
  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              mb: 1,
            }}
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
            The talented people behind every perfect set of nails. Our team brings
            creativity, skill, and passion to everything we do.
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured — CEO first */}
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
              src={teamMembers[0].image}
              alt={teamMembers[0].name}
              sx={{
                width: { xs: '100%', md: '40%' },
                height: { xs: 320, md: 400 },
                objectFit: 'cover',
              }}
            />
            <Box sx={{ p: { xs: 3, md: 5 }, flex: 1 }}>
              <Chip
                label={teamMembers[0].department}
                size="small"
                sx={{
                  backgroundColor: departmentColors[teamMembers[0].department] || '#E91E8C',
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
                  color: '#000',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                {teamMembers[0].name}
              </Typography>
              <Typography
                sx={{
                  color: '#E91E8C',
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  mb: 2,
                }}
              >
                {teamMembers[0].role}
              </Typography>
              <Typography
                sx={{
                  color: '#555',
                  fontSize: '1.05rem',
                  lineHeight: 1.8,
                }}
              >
                {teamMembers[0].bio}
              </Typography>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Team Grid */}
        <Grid container spacing={4}>
          {teamMembers.slice(1).map((member, index) => (
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
                      boxShadow: '0 12px 32px rgba(233,30,140,0.12)',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={member.image}
                    alt={member.name}
                    sx={{
                      width: '100%',
                      height: 280,
                      objectFit: 'cover',
                    }}
                  />
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={member.department}
                        size="small"
                        sx={{
                          backgroundColor: departmentColors[member.department] || '#E91E8C',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          fontFamily: '"Georgia", serif',
                          height: 24,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        color: '#000',
                        fontSize: '1.15rem',
                        mb: 0.3,
                      }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#E91E8C',
                        fontFamily: '"Georgia", serif',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        mb: 1.5,
                      }}
                    >
                      {member.role}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666',
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                        flex: 1,
                      }}
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

import { Box, Typography, Container, Grid, Chip } from '@mui/material';
import ScrollReveal from '../components/ScrollReveal';
import { blogPosts } from '../data/blog';

const categoryColors = {
  'Nail Care': '#E91E8C',
  'Gel Polishes': '#4A0E4E',
  'Nail Brands': '#C2185B',
};

export default function BlogPage() {
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
            The Chizzystyles Journal
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              color: '#777',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              fontFamily: '"Georgia", serif',
            }}
          >
            Tips, trends, and everything nails
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured Post — first item */}
        <ScrollReveal direction="up">
          <Box
            sx={{
              mb: 8,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            <Box
              component="img"
              src={blogPosts[0].image}
              alt={blogPosts[0].title}
              sx={{
                width: { xs: '100%', md: '55%' },
                height: { xs: 280, md: 400 },
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Chip
                label={blogPosts[0].category}
                size="small"
                sx={{
                  backgroundColor: categoryColors[blogPosts[0].category] || '#E91E8C',
                  color: '#fff',
                  fontWeight: 600,
                  mb: 2,
                  width: 'fit-content',
                  fontFamily: '"Georgia", serif',
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: '#000',
                  mb: 2,
                  lineHeight: 1.3,
                }}
              >
                {blogPosts[0].title}
              </Typography>
              <Typography sx={{ color: '#555', lineHeight: 1.7, mb: 2 }}>
                {blogPosts[0].excerpt}
              </Typography>
              <Typography sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                {blogPosts[0].date}
              </Typography>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Grid of remaining posts */}
        <Grid container spacing={4}>
          {blogPosts.slice(1).map((post, index) => (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <ScrollReveal direction="up" delay={index * 0.1}>
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
                    src={post.image}
                    alt={post.title}
                    sx={{
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                    }}
                  />
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Chip
                      label={post.category}
                      size="small"
                      sx={{
                        backgroundColor: categoryColors[post.category] || '#E91E8C',
                        color: '#fff',
                        fontWeight: 600,
                        mb: 1.5,
                        width: 'fit-content',
                        fontSize: '0.75rem',
                        fontFamily: '"Georgia", serif',
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        color: '#000',
                        mb: 1.5,
                        lineHeight: 1.3,
                        fontSize: '1.05rem',
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#666',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        flex: 1,
                        mb: 2,
                      }}
                    >
                      {post.excerpt}
                    </Typography>
                    <Typography sx={{ color: '#bbb', fontSize: '0.8rem' }}>
                      {post.date}
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

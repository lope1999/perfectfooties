import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Chip,
  Dialog,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ScrollReveal from '../components/ScrollReveal';
import useBlogPosts from '../hooks/useBlogPosts';
import ScrollToTopFab from '../components/ScrollToTopFab';

const categoryColors = {
	"Leather Care": "#e3242b",
	"Craftsmanship": "#007a7a",
	"Style Guide": "#b81b21",
	"Behind the Craft": "#AD1457",
	"Leather Trends": "#880E4F",
	"Collections": "#9a1b50",
	"Custom Orders": "#C4965A",
};

export default function BlogPage() {
  const { posts: blogPosts, loading } = useBlogPosts();
  const [selectedPost, setSelectedPost] = useState(null);

  if (loading) {
    return (
      <Box sx={{ pt: 20, display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
        <CircularProgress sx={{ color: '#e3242b' }} />
      </Box>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <Box sx={{ pt: 20, textAlign: 'center', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
        <Typography sx={{ fontFamily: '"Georgia", serif', color: '#777', fontSize: '1.1rem' }}>
          No blog posts yet. Check back soon!
        </Typography>
      </Box>
    );
  }

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
              color: 'var(--text-main)',
              mb: 1,
            }}
          >
            The PerfectFooties Journal
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
            Craft stories, leather care tips, and style inspiration
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured Post — first item */}
        <ScrollReveal direction="up">
          <Box
            onClick={() => setSelectedPost(blogPosts[0])}
            sx={{
              mb: 8,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 40px rgba(233,30,140,0.15)',
              },
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={blogPosts[0].category}
                  size="small"
                  sx={{
                    backgroundColor: categoryColors[blogPosts[0].category] || '#e3242b',
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Georgia", serif',
                  }}
                />
                <Typography sx={{ color: '#aaa', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 14 }} />
                  {blogPosts[0].readTime}
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  mb: 2,
                  lineHeight: 1.3,
                }}
              >
                {blogPosts[0].title}
              </Typography>
              <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.7, mb: 2 }}>
                {blogPosts[0].excerpt}
              </Typography>
              <Typography sx={{ color: '#aaa', fontSize: '0.85rem' }}>
                {blogPosts[0].date}
              </Typography>
              <Typography
                sx={{
                  color: '#e3242b',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: '"Georgia", serif',
                  mt: 2,
                }}
              >
                Read more
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
                  onClick={() => setSelectedPost(post)}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={post.category}
                        size="small"
                        sx={{
                          backgroundColor: categoryColors[post.category] || '#e3242b',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          fontFamily: '"Georgia", serif',
                        }}
                      />
                      <Typography sx={{ color: '#bbb', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <AccessTimeIcon sx={{ fontSize: 12 }} />
                        {post.readTime}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        mb: 1.5,
                        lineHeight: 1.3,
                        fontSize: '1.05rem',
                      }}
                    >
                      {post.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        flex: 1,
                        mb: 2,
                      }}
                    >
                      {post.excerpt}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: '#bbb', fontSize: '0.8rem' }}>
                        {post.date}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#e3242b',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          fontFamily: '"Georgia", serif',
                        }}
                      >
                        Read more
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Blog Detail Modal */}
      <Dialog
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
          },
        }}
      >
        {selectedPost && (
          <>
            {/* Modal Header Image */}
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={selectedPost.image}
                alt={selectedPost.title}
                sx={{
                  width: '100%',
                  height: { xs: 200, sm: 280, md: 340 },
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
                }}
              />
              <IconButton
                onClick={() => setSelectedPost(null)}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': { backgroundColor: '#fff' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal Content */}
            <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              {/* Category + Read Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedPost.category}
                  size="small"
                  sx={{
                    backgroundColor: categoryColors[selectedPost.category] || '#e3242b',
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Georgia", serif',
                  }}
                />
                <Typography sx={{ color: '#999', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  {selectedPost.readTime}
                </Typography>
              </Box>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  mb: 3,
                  lineHeight: 1.3,
                  fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.2rem' },
                }}
              >
                {selectedPost.title}
              </Typography>

              {/* Meta Info */}
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 2, sm: 3 },
                  mb: 4,
                  flexWrap: 'wrap',
                  p: 2,
                  backgroundColor: '#FFF8F0',
                  borderRadius: 2,
                  border: '1px solid #E8D5B0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <PersonOutlineIcon sx={{ color: '#e3242b', fontSize: 20 }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#999', lineHeight: 1 }}>
                      Written by
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedPost.author}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <CalendarTodayIcon sx={{ color: '#e3242b', fontSize: 18 }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#999', lineHeight: 1 }}>
                      Published
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedPost.date}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AccessTimeIcon sx={{ color: '#e3242b', fontSize: 18 }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#999', lineHeight: 1 }}>
                      Read time
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {selectedPost.readTime}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Article Body */}
              {selectedPost.body.map((paragraph, i) => (
                <Typography
                  key={i}
                  sx={{
                    color: 'var(--text-muted)',
                    fontSize: '1rem',
                    lineHeight: 1.85,
                    mb: 2.5,
                  }}
                >
                  {paragraph}
                </Typography>
              ))}

              {/* Sources */}
              {selectedPost.sources && selectedPost.sources.length > 0 && (
                <>
                  <Divider sx={{ my: 4, borderColor: '#E8D5B0' }} />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MenuBookIcon sx={{ color: '#e3242b', fontSize: 22 }} />
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        Sources & References
                      </Typography>
                    </Box>
                    {selectedPost.sources.map((source, i) => (
                      <Typography
                        key={i}
                        sx={{
                          color: '#777',
                          fontSize: '0.88rem',
                          lineHeight: 1.8,
                          pl: 2,
                          borderLeft: '2px solid #E8D5B0',
                          mb: 1,
                        }}
                      >
                        {source}
                      </Typography>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}
      </Dialog>
      <ScrollToTopFab />
    </Box>
  );
}

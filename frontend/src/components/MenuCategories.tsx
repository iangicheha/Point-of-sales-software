import React from 'react';
import { Paper, List, ListItem, ListItemText, ListItemButton, Typography, Grid, Card, CardMedia, CardContent, CardActions, Button, Box, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MenuItem } from '../types/menu';

const CategoryTab = styled(Tab)(({ theme }) => ({
  minWidth: 120,
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.shape.borderRadius,
  },
}));

interface MenuCategoriesProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void;
}

export const MenuCategories: React.FC<MenuCategoriesProps> = ({ items, onSelectItem }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');

  // Group items by category
  const categories = React.useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  }, [items]);

  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    } else if (categories.length === 0 && selectedCategory) {
      setSelectedCategory('');
    } else if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0] || '');
    }
  }, [categories, selectedCategory]);

  // Ensure selectedCategory is always valid before rendering Tabs
  if (categories.length > 0 && !categories.includes(selectedCategory)) {
    setSelectedCategory(categories[0]);
    return null; // Prevent rendering until state is valid
  }

  const filteredItems = React.useMemo(() => 
    items.filter(item => item.category === selectedCategory),
    [items, selectedCategory]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Categories Tabs - now horizontal */}
      {categories.length > 0 ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Tabs
              orientation="horizontal"
              value={selectedCategory}
              onChange={(_, newValue) => setSelectedCategory(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderRadius: 4,
                background: '#f5f5f5',
                p: 1,
                minHeight: 48,
                boxShadow: 1,
                '.MuiTabs-indicator': { display: 'none' },
              }}
            >
              {categories.map((category) => (
                <CategoryTab
                  key={category}
                  label={category}
                  value={category}
                  sx={{
                    borderRadius: 999,
                    mx: 1,
                    minWidth: 100,
                    fontWeight: 600,
                    bgcolor: selectedCategory === category ? 'primary.main' : 'white',
                    color: selectedCategory === category ? 'white' : 'primary.main',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory === category ? 2 : 0,
                  }}
                />
              ))}
            </Tabs>
          </Box>
          {/* Menu Items Grid */}
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            <Grid container spacing={2}>
              {filteredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6, bgcolor: '#f0f4ff' } }}
                    onClick={() => onSelectItem(item)}
                  >
                    {item.image && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={item.image}
                        alt={item.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {item.name}
                      </Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        ${Number(item.price).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No categories found.
        </Typography>
      )}
    </Box>
  );
}; 
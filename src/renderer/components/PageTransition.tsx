import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier для плавности
      }}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <Box sx={{ width: '100%', height: '100%' }}>
        {children}
      </Box>
    </motion.div>
  );
};

export default PageTransition;

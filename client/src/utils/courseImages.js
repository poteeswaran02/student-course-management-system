// Real, professional education & technology photography for course cards
export const getCourseThumbnail = (course) => {
  const text = ((course?.category || '') + ' ' + (course?.title || '')).toLowerCase();

  if (text.includes('python')) {
    return {
      src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
      alt: 'Python code editor and programming terminal on workstation'
    };
  }
  if (text.includes('web') || text.includes('full stack') || text.includes('frontend') || text.includes('javascript') || text.includes('react')) {
    return {
      src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
      alt: 'Web development setup with source code on screen'
    };
  }
  if (text.includes('data') || text.includes('science') || text.includes('analytics') || text.includes('machine learning') || text.includes('ai')) {
    return {
      src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      alt: 'Data science graphs, analytics and statistical metrics on monitor'
    };
  }
  if (text.includes('cloud') || text.includes('devops') || text.includes('aws') || text.includes('docker') || text.includes('kubernetes')) {
    return {
      src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      alt: 'Cloud computing network infrastructure and digital data stream'
    };
  }
  if (text.includes('java')) {
    return {
      src: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      alt: 'Java software engineering code and development environment'
    };
  }

  // General technology education fallback
  return {
    src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    alt: 'Online education and technology learning environment'
  };
};

// Currency formatter for Indian Rupees (₹)
export const formatPriceINR = (fee) => {
  const num = Number(fee);
  if (!num || num === 0) {
    return 'Free';
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

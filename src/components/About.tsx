import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about">
      <h1>About AIDetect</h1>
      <div className="about-content">
        <section>
          <h2>Our Mission</h2>
          <p>
            AIDetect provides cutting-edge AI-powered content analysis solutions 
            to help businesses and individuals make informed decisions about their digital content.
          </p>
        </section>
        
        <section>
          <h2>Contact Us</h2>
          <div className="contact-info">
            <p><strong>Email:</strong> support@aidetect.com</p>
            <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Address:</strong> 123 Tech Street, Innovation City, IC 12345</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
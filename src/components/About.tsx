import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about">
      <h1>About VeriForensic</h1>
      <div className="about-content">
        <section>
          <h2>Our Mission</h2>
          <p>
            In a world where digital content can be manipulated, VeriForensic provides 
            transparent, AI-powered media analysis to help you make confident decisions 
            about the content you create, share, and trust.
          </p>
        </section>

        <section>
          <h2>Our Commitment to Trust</h2>
          <div className="trust-principles">
            <div className="principle">
              <h3>Transparency</h3>
              <p>
                We believe you deserve to understand how our analysis works. 
                Our methods are documented and our limitations are clearly stated.
              </p>
            </div>
            <div className="principle">
              <h3>Accuracy</h3>
              <p>
                We continuously validate our AI models against known datasets 
                and update our systems as new manipulation techniques emerge.
              </p>
            </div>
            <div className="principle">
              <h3>Privacy</h3>
              <p>
                Your content is processed with strict confidentiality. 
                We don't store your media longer than necessary for analysis.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p className="contact-intro">
            Have questions about our technology or concerns about digital content?
            We're here to help.
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@veriforensic.com</p>
            <p><strong>Phone:</strong> +44 (748) 216-8597</p>
            <p><strong>Address:</strong> 731, Sewal Highway, CV6 7JN</p>
            <p><strong>City:</strong> Coventry, United Kingdom</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
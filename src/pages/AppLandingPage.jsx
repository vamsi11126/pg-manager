import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Shield, Zap, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AppLandingPage = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '', phone: '', location: '' });
  const [status, setStatus] = React.useState('idle'); // idle, submitting, success, error

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const { error } = await supabase
        .from('platform_leads')
        .insert([formData]);

      if (error) throw error;
      
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', location: '' });
    } catch (err) {
      console.error('Error submitting form:', err);
      setStatus('error');
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        padding: '1.25rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>PG Manager</h2>
        </div>
        <div>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Login <ArrowRight size={18} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <section style={{ 
          padding: '6rem 2rem 4rem', 
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '999px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#c7d2fe',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '2rem'
          }}>
            <Zap size={16} color="var(--primary)" /> The Ultimate PG Management Solution
          </div>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Manage Your PG Like a Pro
          </h1>
          <p style={{ 
            fontSize: '1.125rem', 
            color: 'var(--text-muted)', 
            marginBottom: '3rem',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto 3rem'
          }}>
            Streamline rent collection, track electricity, manage tenants, and solve issues instantly. The all-in-one platform for PG owners and residents.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
              Get Started
            </Link>
            <button onClick={scrollToContact} className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
              Get in Touch
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '4rem 2rem', background: 'rgba(0,0,0,0.2)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Everything You Need</h2>
              <p style={{ color: 'var(--text-muted)' }}>Powerful features designed to make PG management effortless.</p>
            </div>
            
            <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: '0.5rem' }}>
                  <Users size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Tenant Management</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Easily onboard tenants, track their details, and manage room allocations in real-time. Everything is organized in one place.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', marginBottom: '0.5rem' }}>
                  <TrendingUp size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Rent & Finances</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Automate rent calculations, track payments, and generate transparent financial reports effortlessly.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', marginBottom: '0.5rem' }}>
                  <Shield size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Dedicated Portals</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Provide separate secure logins for owners, tenants, and guardians, ensuring everyone has the right access and information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact/Lead Form Section */}
        <section id="contact-section" style={{ padding: '4rem 2rem' }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Interested in PG Manager?</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                Leave your details below and our team will get in touch with you shortly to set up your account.
              </p>

              {status === 'success' ? (
                <div style={{ 
                  padding: '2rem', 
                  borderRadius: '12px', 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <CheckCircle size={48} color="#4ade80" />
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem', color: '#4ade80' }}>Thank you!</h3>
                    <p style={{ margin: 0, color: '#f8fafc' }}>Your details have been submitted. The team will contact you shortly.</p>
                  </div>
                  <button onClick={() => setStatus('idle')} className="btn btn-outline" style={{ marginTop: '1rem' }}>
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                  {status === 'error' && (
                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f8c5c5', fontSize: '0.9rem', textAlign: 'center' }}>
                      Something went wrong. Please try again.
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      placeholder="e.g. John Doe"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      placeholder="e.g. john@example.com"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      placeholder="e.g. +91 9876543210"
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>PG Location / City</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleInputChange} 
                      className="input-field" 
                      style={{ marginBottom: 0 }}
                      placeholder="e.g. Bangalore"
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ marginTop: '1rem', height: '3rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <div className="app-loader" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: 'white' }} />
                    ) : (
                      'Submit Details'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--text-muted)',
        fontSize: '0.875rem'
      }}>
        &copy; {new Date().getFullYear()} PG Manager. All rights reserved.
      </footer>
    </div>
  );
};

export default AppLandingPage;

import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Building2,
    Mail,
    Settings2,
    UserPlus,
    UtensilsCrossed,
    BadgeCheck,
    Info
} from 'lucide-react';

const steps = [
    {
        number: 1,
        title: 'Create PG',
        description: 'After logging into your account, first create your PG by entering the PG name and address. Providing the location is optional.',
        icon: Building2,
        notes: [
            { type: 'tip', text: 'Start with clear PG name and address to make future tenant mapping easier.' }
        ],
        points: ['PG Name', 'Address']
    },
    {
        number: 2,
        title: 'Manage PG Details',
        description: 'After creating the PG, open Manage Details and add complete property information.',
        icon: Settings2,
        points: [
            'Room configuration',
            'Facilities',
            'Wi-Fi details',
            'Electricity details',
            'PG highlights',
            'Gallery images'
        ],
        notes: [
            { type: 'info', text: 'Complete details improve tenant trust and reduce repeated queries.' }
        ]
    },
    {
        number: 3,
        title: 'Add Room Categories and Food Menu',
        description: 'Add all room categories available in your PG, then configure your food menu with monthly food cost.',
        icon: UtensilsCrossed,
        points: ['Single sharing', 'Double sharing', 'Triple sharing', 'Monthly food cost for tenants'],
        notes: [
            { type: 'tip', text: 'Set accurate food cost to avoid billing disputes later.' }
        ]
    },
    {
        number: 4,
        title: 'Register Tenant',
        description: 'Click Register Tenant and fill all tenant details carefully.',
        icon: UserPlus,
        notes: [
            { type: 'warn', text: 'After clicking Register Tenant, confirm rent amount and advance amount in the popup before proceeding.' }
        ],
        points: ['Rent amount', 'Advance amount']
    },
    {
        number: 5,
        title: 'Create Tenant Login',
        description: 'Click Create Login. The tenant receives an email with login credentials to access the tenant portal.',
        icon: Mail,
        notes: [
            { type: 'info', text: 'Ask tenants to reset their password after first login for security.' }
        ]
    }
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut', delay: index * 0.08 }
    })
};

const noteStyles = {
    tip: {
        border: '1px solid rgba(34, 197, 94, 0.3)',
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#bbf7d0',
        label: 'Tip'
    },
    info: {
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'rgba(6, 182, 212, 0.12)',
        color: '#a5f3fc',
        label: 'Note'
    },
    warn: {
        border: '1px solid rgba(245, 158, 11, 0.3)',
        background: 'rgba(245, 158, 11, 0.12)',
        color: '#fde68a',
        label: 'Important'
    }
};

const MotionCard = motion.article;

const StepCard = ({ step, index }) => {
    const StepIcon = step.icon;

    return (
        <MotionCard
            className="glass-card manual-step-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={index}
        >
            <div className="manual-step-head">
                <span className="manual-step-badge">Step {step.number}</span>
                <div className="manual-step-icon-wrap">
                    <StepIcon size={18} />
                </div>
            </div>
            <h3>{step.title}</h3>
            <p className="manual-step-description">{step.description}</p>

            {step.points?.length > 0 && (
                <ul className="manual-points-list">
                    {step.points.map((point) => (
                        <li key={point}>{point}</li>
                    ))}
                </ul>
            )}

            {step.notes?.length > 0 && (
                <div className="manual-notes-wrap">
                    {step.notes.map((note, noteIndex) => {
                        const style = noteStyles[note.type] || noteStyles.info;
                        return (
                            <div
                                key={`${step.number}-${noteIndex}`}
                                className="manual-note-box"
                                style={{ border: style.border, background: style.background, color: style.color }}
                            >
                                <Info size={14} />
                                <span>
                                    <strong>{style.label}:</strong> {note.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </MotionCard>
    );
};

const UserManual = () => {
    return (
        <div className="container" style={{ padding: 0 }}>
            <header className="glass-card manual-header-card">
                <div className="manual-title-wrap">
                    <div className="manual-title-icon">
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <h1 style={{ marginBottom: '0.4rem' }}>PG Owner User Manual</h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Follow these steps to set up and manage your PG smoothly.
                        </p>
                    </div>
                </div>
                <div className="manual-progress-wrap">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="manual-progress-node">
                                <span>{step.number}</span>
                            </div>
                            {index < steps.length - 1 && <div className="manual-progress-line" />}
                        </React.Fragment>
                    ))}
                </div>
            </header>

            <section className="manual-steps-grid">
                {steps.map((step, index) => (
                    <StepCard key={step.number} step={step} index={index} />
                ))}
            </section>

            <section className="glass-card manual-footer-note">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    <BadgeCheck size={18} color="var(--success)" />
                    <h3 style={{ marginBottom: 0 }}>Quick Reminder</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
                    Keep PG details, rent values, and tenant contact information updated regularly to ensure smooth
                    operations and accurate communication.
                </p>
            </section>
        </div>
    );
};

export default UserManual;

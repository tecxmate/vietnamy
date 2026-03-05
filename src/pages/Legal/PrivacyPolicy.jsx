import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-header">
                <button className="legal-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="legal-title">Privacy Policy</h1>
            </div>

            <div className="legal-content">
                <p className="legal-updated">Last Updated: November 2024</p>

                <section className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Vietnamy. We are TECXMATE Corporation Ltd. (CÔNG TY TNHH TECXMATE), a Limited Liability Company headquartered in Ho Chi Minh City, Vietnam. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Vietnamy app.
                    </p>
                    <p>
                        By using our app or services, you consent to the data practices described in this policy.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Information You Provide</h3>
                    <ul>
                        <li><strong>Contact Information:</strong> Name, email address, phone number, company name</li>
                        <li><strong>Project Details:</strong> Project requirements, business information, technical specifications</li>
                        <li><strong>Communication Records:</strong> Messages, emails, meeting notes, and other correspondence</li>
                        <li><strong>Account Information:</strong> If you create an account, we collect login credentials and profile information</li>
                    </ul>
                    <h3>2.2 Automatically Collected Information</h3>
                    <ul>
                        <li><strong>App Usage:</strong> Device information, pages visited, time spent on pages</li>
                        <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance your experience and analyze app traffic</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>3. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li><strong>Provide Services:</strong> Deliver our language learning features</li>
                        <li><strong>Communication:</strong> Respond to inquiries and send important notices</li>
                        <li><strong>Business Operations:</strong> Improve our services, conduct analytics, and manage our business relationships</li>
                        <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>4. Data Collection Consent</h2>
                    <p>
                        Before collecting and processing your personal information, we will obtain your explicit consent. You have the right to:
                    </p>
                    <ul>
                        <li>Review the specific data we intend to collect</li>
                        <li>Provide or withdraw consent at any time</li>
                        <li>Request access to your personal data</li>
                        <li>Request correction or deletion of your data</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>5. Information Sharing and Disclosure</h2>
                    <p>We respect your privacy and do not sell your personal information. We may share information only in the following circumstances:</p>
                    <h3>5.1 With Your Consent</h3>
                    <p>We may share your information when you have given us explicit permission to do so.</p>
                    <h3>5.2 Service Providers</h3>
                    <p>We may share information with trusted third-party service providers who assist us in operating our business, subject to confidentiality agreements.</p>
                    <h3>5.3 Legal Requirements</h3>
                    <p>We may disclose information if required by law, court order, or government regulation, or to protect our rights, property, or safety.</p>
                    <h3>5.4 Business Transfers</h3>
                    <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
                </section>

                <section className="legal-section">
                    <h2>6. Data Security</h2>
                    <p>We implement appropriate technical and organizational security measures to protect your information:</p>
                    <ul>
                        <li><strong>Encryption:</strong> Data in transit is encrypted using industry-standard protocols</li>
                        <li><strong>Access Controls:</strong> Limited access to personal information on a need-to-know basis</li>
                        <li><strong>Secure Storage:</strong> Information stored in secure, encrypted databases</li>
                        <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
                    </ul>
                    <p>However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                </section>

                <section className="legal-section">
                    <h2>7. Data Retention</h2>
                    <p>We retain your personal information for as long as necessary to:</p>
                    <ul>
                        <li>Provide our services to you</li>
                        <li>Comply with legal obligations</li>
                        <li>Resolve disputes and enforce agreements</li>
                        <li>Maintain business records as required by law</li>
                    </ul>
                    <p>When information is no longer needed, we will securely delete or anonymize it.</p>
                </section>

                <section className="legal-section">
                    <h2>8. Your Rights</h2>
                    <p>You have the following rights regarding your personal information:</p>
                    <ul>
                        <li><strong>Access:</strong> Request access to your personal data</li>
                        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                        <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                        <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                        <li><strong>Objection:</strong> Object to processing of your data for specific purposes</li>
                        <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                    </ul>
                    <p>To exercise these rights, please contact us at <a href="mailto:ceo@tecxmate.com">ceo@tecxmate.com</a>.</p>
                </section>

                <section className="legal-section">
                    <h2>9. International Data Transfers</h2>
                    <p>As a team serving clients worldwide, your information may be transferred to and processed in countries outside your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.</p>
                </section>

                <section className="legal-section">
                    <h2>10. Children's Privacy</h2>
                    <p>Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
                </section>

                <section className="legal-section">
                    <h2>11. Changes to This Privacy Policy</h2>
                    <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
                </section>

                <section className="legal-section">
                    <h2>12. Contact Us</h2>
                    <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
                    <div className="legal-contact-card">
                        <p><strong>TECXMATE Corporation Ltd.</strong><br />
                            CÔNG TY TNHH TECXMATE / 達盟科技有限公司</p>
                        <p>Villa Park Complex, Phu Huu Ward, Ho Chi Minh City, Vietnam</p>
                        <p>Email: <a href="mailto:ceo@tecxmate.com">ceo@tecxmate.com</a></p>
                        <p>Website: <a href="https://www.tecxmate.com" target="_blank" rel="noopener noreferrer">www.tecxmate.com</a></p>
                    </div>
                    <p className="legal-governing">Governing Law: This Privacy Policy is governed by the laws of Vietnam.</p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

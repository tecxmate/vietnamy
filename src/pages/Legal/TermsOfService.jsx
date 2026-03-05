import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Legal.css';

const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-header">
                <button className="legal-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="legal-title">Terms of Service</h1>
            </div>

            <div className="legal-content">
                <p className="legal-updated">Last Updated: November 2024</p>

                <section className="legal-section">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Vietnamy. We are TECXMATE Corporation Ltd. (CÔNG TY TNHH TECXMATE), a Limited Liability Company headquartered in Ho Chi Minh City, Vietnam, providing premier technology consultancy and solutions to clients in Taiwan, the US, and Vietnam. These Terms of Service ("Terms") govern your access to and use of our app and services.
                    </p>
                    <p>
                        By accessing our app or engaging our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our app or services.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. About TECXMATE</h2>
                    <p>TECXMATE is an independent development team specializing in:</p>
                    <ul>
                        <li><strong>AI Application Development:</strong> Building intelligent applications powered by machine learning, natural language processing, and computer vision</li>
                        <li><strong>Business Automation:</strong> Automating workflows, streamlining operations, and integrating systems</li>
                        <li><strong>AI Integration & Consulting:</strong> Integrating AI tools and providing expert guidance on AI strategy</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>3. Service Agreements</h2>
                    <h3>3.1 Project Contracts</h3>
                    <p>All services are provided pursuant to written agreements or contracts ("Service Agreements") that specify:</p>
                    <ul>
                        <li>Project scope and deliverables</li>
                        <li>Timeline and milestones</li>
                        <li>Payment terms and schedules</li>
                        <li>Intellectual property arrangements</li>
                        <li>Other terms specific to your project</li>
                    </ul>
                    <h3>3.2 Payment Terms</h3>
                    <p>Payment terms, including deposits, milestones, and final payments, are defined in the Service Agreement between TECXMATE and the client.</p>
                </section>

                <section className="legal-section">
                    <h2>4. Intellectual Property Rights</h2>
                    <h3>4.1 Client Ownership</h3>
                    <p>The client owns the final product and deliverables created as part of the project. Upon full payment, the client receives ownership rights to the completed work product as specified in the Service Agreement.</p>
                    <h3>4.2 TECXMATE Technology Rights</h3>
                    <p>TECXMATE retains ownership of the underlying technology, methodologies, tools, frameworks, and techniques developed or utilized during project work. This includes:</p>
                    <ul>
                        <li>Proprietary development frameworks and libraries</li>
                        <li>Reusable code components and modules</li>
                        <li>Development methodologies and processes</li>
                        <li>Technical knowledge and expertise gained</li>
                    </ul>
                    <h3>4.3 Technology Reuse</h3>
                    <p>TECXMATE may use the technology, tools, and methodologies we own for other development projects, subject to the following restrictions:</p>
                    <ul>
                        <li><strong>No Direct Competition:</strong> TECXMATE will not create a direct competitor to the client's product or service</li>
                        <li><strong>Confidentiality:</strong> We maintain confidentiality of client-specific information and business logic</li>
                        <li><strong>Fair Use:</strong> Technology reuse is limited to underlying technical components, not client-specific features or business logic</li>
                    </ul>
                    <h3>4.4 Pre-existing Materials</h3>
                    <p>Any pre-existing materials, code, or intellectual property owned by either party prior to the project remain the property of the original owner.</p>
                </section>

                <section className="legal-section">
                    <h2>5. Client Responsibilities</h2>
                    <p>As a client, you agree to:</p>
                    <ul>
                        <li><strong>Provide Accurate Information:</strong> Supply accurate, complete, and timely information necessary for project completion</li>
                        <li><strong>Timely Feedback:</strong> Provide feedback and approvals in a timely manner to avoid project delays</li>
                        <li><strong>Payment Obligations:</strong> Make payments according to the terms specified in the Service Agreement</li>
                        <li><strong>Compliance:</strong> Ensure that any content or materials you provide comply with applicable laws and do not infringe third-party rights</li>
                        <li><strong>Cooperation:</strong> Cooperate reasonably with TECXMATE in the performance of services</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>6. Service Standards</h2>
                    <p>We strive to provide high-quality services. However, you acknowledge that:</p>
                    <ul>
                        <li><strong>No Guarantees:</strong> We do not guarantee specific business outcomes, results, or performance metrics</li>
                        <li><strong>Timeline Estimates:</strong> Project timelines are estimates and may be subject to change</li>
                        <li><strong>Scope Changes:</strong> Material changes to project scope may require adjustments to timeline and pricing</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>7. Limitation of Liability</h2>
                    <p>As of the date of these Terms, TECXMATE's liability limitations are as follows:</p>
                    <ul>
                        <li><strong>No Liability Accepted:</strong> TECXMATE does not assume liability for any damages, losses, or claims arising from the use of our services, except as may be explicitly agreed in writing in a Service Agreement</li>
                        <li><strong>Use at Your Own Risk:</strong> You use our services at your own risk</li>
                        <li><strong>No Warranties:</strong> Services are provided "as is" without warranties of any kind, express or implied</li>
                    </ul>
                    <h3>7.1 Limitation of Damages</h3>
                    <p>To the maximum extent permitted by law, TECXMATE's total liability for any claims shall not exceed the total amount paid by the client to TECXMATE for the specific project giving rise to the claim.</p>
                    <h3>7.2 Excluded Damages</h3>
                    <p>TECXMATE shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.</p>
                </section>

                <section className="legal-section">
                    <h2>8. Confidentiality</h2>
                    <ul>
                        <li><strong>Non-Disclosure:</strong> We will not disclose your confidential information to third parties without your consent</li>
                        <li><strong>Confidential Information:</strong> Includes business plans, proprietary information, customer data, and other sensitive information</li>
                        <li><strong>Exceptions:</strong> Confidentiality obligations do not apply to information that is publicly available, independently developed, or required to be disclosed by law</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>9. Data Collection and Privacy</h2>
                    <p>
                        Your privacy is important to us. Please review our Privacy Policy which explains how we collect, use, and protect your information. Before collecting your personal information, we will obtain your explicit consent. You have the right to review and consent to data collection practices.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>10. Termination</h2>
                    <h3>10.1 By Client</h3>
                    <p>You may terminate a Service Agreement according to the terms specified in that agreement. Termination may be subject to payment for work completed and cancellation fees as specified in the Service Agreement.</p>
                    <h3>10.2 By TECXMATE</h3>
                    <p>We may terminate a Service Agreement if you breach material terms of the agreement, payment obligations are not met, or other circumstances as specified in the Service Agreement.</p>
                </section>

                <section className="legal-section">
                    <h2>11. Dispute Resolution</h2>
                    <h3>11.1 Governing Law</h3>
                    <p>These Terms are governed by and construed in accordance with the laws of Taiwan, Republic of China.</p>
                    <h3>11.2 Dispute Resolution Process</h3>
                    <p>Any disputes shall be resolved through:</p>
                    <ul>
                        <li><strong>Good Faith Negotiation:</strong> Parties will attempt to resolve disputes through good faith discussion</li>
                        <li><strong>Mediation:</strong> If negotiation fails, disputes may be submitted to mediation</li>
                        <li><strong>Jurisdiction:</strong> Any legal proceedings shall be subject to the exclusive jurisdiction of the courts of Taiwan</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>12. Website & App Use</h2>
                    <h3>12.1 Acceptable Use</h3>
                    <p>You agree to use our app only for lawful purposes. You agree not to:</p>
                    <ul>
                        <li>Use the app in any way that violates applicable laws</li>
                        <li>Attempt to gain unauthorized access to any part of the app</li>
                        <li>Interfere with or disrupt the app or servers</li>
                        <li>Use automated systems to access the app without permission</li>
                    </ul>
                    <h3>12.2 Content</h3>
                    <p>Content on our app, including text, graphics, logos, and software, is owned by TECXMATE or its licensors and is protected by copyright and other intellectual property laws.</p>
                </section>

                <section className="legal-section">
                    <h2>13. Modifications to Terms</h2>
                    <p>We reserve the right to modify these Terms at any time. Material changes will be communicated by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of our app after changes are posted constitutes acceptance of the modified Terms.</p>
                </section>

                <section className="legal-section">
                    <h2>14. Severability</h2>
                    <p>If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
                </section>

                <section className="legal-section">
                    <h2>15. Entire Agreement</h2>
                    <p>These Terms, together with any Service Agreements, constitute the entire agreement between you and TECXMATE regarding the subject matter herein and supersede all prior agreements and understandings.</p>
                </section>

                <section className="legal-section">
                    <h2>16. Contact Information</h2>
                    <p>If you have any questions about these Terms of Service, please contact us:</p>
                    <div className="legal-contact-card">
                        <p><strong>TECXMATE Corporation Ltd.</strong><br />
                            CÔNG TY TNHH TECXMATE / 達盟科技有限公司</p>
                        <p>Villa Park Complex, Phu Huu Ward, Ho Chi Minh City, Vietnam</p>
                        <p>Email: <a href="mailto:ceo@tecxmate.com">ceo@tecxmate.com</a></p>
                        <p>Website: <a href="https://www.tecxmate.com" target="_blank" rel="noopener noreferrer">www.tecxmate.com</a></p>
                    </div>
                    <p className="legal-governing">Governing Law: These Terms of Service are governed by the laws of Vietnam.</p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;

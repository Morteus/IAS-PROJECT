import React, { useState } from "react";
import "./login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faCar } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { handleLogin } from "../databaseComponent"; // Import handleLogin

const termsAndConditionsContent = `
  <h2>Terms and Conditions for Aparkr</h2>
  <p><b>Last updated: April 16, 2025</b></p>
  <p>Please read these terms and conditions carefully before using Our Service.</p>
  <h3>Interpretation and Definitions</h3>
  <h4>Interpretation</h4>
  <p>The words of which the initial letter is capitalized have meanings defined under the
  following conditions. The following definitions shall have the same meaning regardless
  of whether they appear in singular or plural.</p>
  <h4>Definitions</h4>
  <p>For these Terms and Conditions:</p>
  <ul>
    <li><b>Affiliate</b> means an entity that controls, is controlled by, or is under common
    control with a party, where "control" means ownership of 50% or more of the
    shares, equity interest, or other securities entitled to vote for election of directors
    or other managing authority.</li>
    <li><b>Country</b> refers to: Philippines</li>
    <li><b>Company</b> (referred to as either "the Company", "We", "Us" or "Our" in this
    Agreement) refers to Aparkr.Corp, 45 Rizal Street, Barangay San Antonio, Cavite
    City, Cavite, 4100, Philippines.</li>
    <li><b>Device</b> means any device that can access the Service, such as a computer, a
    cellphone, or a digital tablet.</li>
    <li><b>Service</b> refers to the Website.</li>
    <li><b>Terms and Conditions</b> (also referred to as "Terms") mean these Terms and
    Conditions that form the entire agreement between You and the Company
    regarding the use of the Service.</li>
    <li><b>Third-party Social Media Service</b> means any services or content (including
    data, information, products or services) provided by a third-party that may be
    displayed, included or made available by the Service.</li>
    <li><b>Website</b> refers to Aparkr, accessible from http://localhost:5173/</li>
    <li><b>You</b> means the individual accessing or using the Service, or the company, or
    other legal entity on behalf of which such individual is accessing or using the
    Service, as applicable.</li>
  </ul>
  <h3>Acknowledgment</h3>
  <p>These are the Terms and Conditions governing the use of this Service and the
  agreement that operates between You and the Company. These Terms and Conditions
  set out the rights and obligations of all users regarding the use of the Service.</p>
  <p>Your access to and use of the Service is conditioned on your acceptance of and
  compliance with these Terms and Conditions. These Terms and Conditions apply to all
  visitors, users, and others who access or use the Service.</p>
  <p>By accessing or using the Service, you agree to be bound by these Terms and
  Conditions. If you disagree with any part of these Terms and Conditions, you may not
  access the Service.</p>
  <p>You represent that you are over the age of 18. The Company does not permit those
  under 18 to use the Service.</p>
  <p>Your access to and use of the Service is also conditioned on your acceptance of and
  compliance with the Privacy Policy of the Company. Our Privacy Policy describes our
  policies and procedures on the collection, use, and disclosure of your personal
  information when you use the Application or the Website and tells you about your
  privacy rights and how the law protects you. Please read our Privacy Policy carefully
  before using our Service.</p>
  <h3>Agreement</h3>
  <p>By accessing, browsing, or using this website, you acknowledge that you have read,
  understood, and agree to be bound by these Terms and Conditions, including the
  Privacy Policy, which is incorporated herein by reference. This Agreement constitutes a
  legally binding agreement between you and Tpark.corp If you do not agree to these
  terms, please do not use this website. Your continued use of the website following the
  posting of changes to these terms will mean you accept those changes.</p>
  <h3>Links to Other Websites</h3>
  <p>Our Service may contain links to third-party websites or services that are not owned or
  controlled by the Company.</p>
  <p>The Company has no control over, and assumes no responsibility for, the content,
  privacy policies, or practices of any third-party websites or services. You further
  acknowledge and agree that the Company shall not be responsible or liable, directly or
  indirectly, for any damage or loss caused or alleged to be caused by or in connection
  with the use of or reliance on any such content, goods, or services available on or
  through any such websites or services.</p>
  <p>We strongly advise you to read the terms and conditions and privacy policies of any
  third-party websites or services that you visit.</p>
  <h3>Termination</h3>
  <p>We may terminate or suspend Your access immediately, without prior notice or liability,
  for any reason whatsoever, including without limitation if You breach these Terms and
  Conditions.</p>
  <p>Upon termination, your right to use the Service will cease immediately.</p>
  <h3>Limitation of Liability</h3>
  <p>Notwithstanding any damages that you might incur, the entire liability of the Company
  and any of its suppliers under any provision of these Terms and your exclusive remedy
  for all of the foregoing shall be limited to the amount paid by you through the Service or
  5000 Pesos if you haven't purchased anything through the Service.</p>
  <p>To the maximum extent permitted by applicable law, in no event shall the Company or
  its suppliers be liable for any special, incidental, indirect, or consequential damages
  whatsoever (including, but not limited to, damages for loss of profits, loss of data or
  other information, for business interruption, for personal injury, loss of privacy arising out
  of or in any way related to the use of or inability to use the Service, third-party software
  and/or third-party hardware used with the Service, or otherwise in connection with any
  provision of this Terms), even if the Company or any supplier has been advised of the
  possibility of such damages and even if the remedy fails of its essential purpose.</p>
  <p>Some states do not allow the exclusion of implied warranties or limitation of liability for
  incidental or consequential damages, which means that some of the above limitations
  may not apply. In these states, each party's liability will be limited to the greatest extent
  permitted by law.</p>
  <h3>"AS IS" and "AS AVAILABLE" Disclaimer</h3>
  <p>The Service is provided to you "AS IS" and "AS AVAILABLE" and with all faults and
  defects without warranty of any kind. To the maximum extent permitted under applicable
  law, the Company, on its behalf and behalf of its Affiliates and its and their respective
  licensors and service providers, expressly disclaims all warranties, whether express,
  implied, statutory or otherwise, concerning the Service, including all implied warranties
  of merchantability, fitness for a particular purpose, title and non-infringement, and
  warranties that may arise out of course of dealing, course of performance, usage or
  trade practice. Without limitation to the foregoing, the Company provides no warranty or
  undertaking, and makes no representation of any kind that the Service will meet Your
  requirements, achieve any intended results, be compatible or work with any other
  software, applications, systems or services, operate without interruption, meet any
  performance or reliability standards or be error free or that any errors or defects can or
  will be corrected.</p>
  <p>Without limiting the foregoing, neither the Company nor any of the company's provider
  makes any representation or warranty of any kind, express or implied: (i) as to the
  operation or availability of the Service, or the information, content, and materials or
  products included thereon; (ii) that the Service will be uninterrupted or error-free; (iii) as
  to the accuracy, reliability, or currency of any information or content provided through
  the Service; or (iv) that the Service, its servers, the content, or e-mails sent from or on
  behalf of the Company are free of viruses, scripts, trojan horses, worms, malware,
  timebombs or other harmful components.</p>
  <p>Some jurisdictions do not allow the exclusion of certain types of warranties or limitations
  on applicable statutory rights of a consumer, so some or all of the above exclusions and
  limitations may not apply to you. But in such a case, the exclusions and limitations
  outlined in this section shall be applied to the greatest extent enforceable under
  applicable law.</p>
  <h3>Governing Law</h3>
  <p>The laws of the Country, excluding its conflicts of law rules, shall govern these Terms
  and your use of the Service. Your use of the Application may also be subject to other
  local, state, national, or international laws.</p>
  <h3>Disputes Resolution</h3>
  <p>If you have any concern or dispute about the Service, you agree to first try to resolve
  the dispute informally by contacting the Company.</p>
  <h3>Severability and Waiver</h3>
  <h4>Severability</h4>
  <p>If any provision of these Terms is held to be unenforceable or invalid, such provision will
  be changed and interpreted to accomplish the objectives of such provision to the
  greatest extent possible under applicable law, and the remaining provisions will continue
  in full force and effect.</p>
  <h4>Waiver</h4>
  <p>Except as provided herein, the failure to exercise a right or to require performance of an
  obligation under these Terms shall not affect a party's ability to exercise such right or
  require such performance at any time thereafter, nor shall the waiver of a breach
  constitute a waiver of any subsequent breach.</p>
  <h3>Translation Interpretation</h3>
  <p>These Terms and Conditions may have been translated if we have made them available
  to you on our Service. You agree that the original English text shall prevail in the case of
  a dispute.</p>
  <h3>Changes to These Terms and Conditions</h3>
  <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any
  time. If a revision is material, we will make reasonable efforts to provide at least 30
  days' notice before any new terms take effect. What constitutes a material change will
  be determined at our sole discretion.</p>
  <p>By continuing to access or use Our Service after those revisions become effective, you
  agree to be bound by the revised terms. If you do not agree to the new terms, in whole
  or in part, please stop using the website and the Service.</p>
  <h3>Contact Us</h3>
  <p>If you have any questions about these Terms and Conditions, you can contact us:</p>
  <p>By email: Aparkr@gmail.com</p>
`;

function Login() {
  const [displayPassword, setDisplayPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setDisplayPassword(!displayPassword);
  };

  const handleTermsClick = () => {
    setShowTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
  };

  const handleNextToAgreement = () => {
    setShowTermsModal(false);
    setShowAgreementModal(true);
  };

  const handleCloseAgreementModal = () => {
    setShowAgreementModal(false);
  };

  const handleAgree = () => {
    setAgreedToTerms(true);
    setShowAgreementModal(false);
    console.log("User agreed to the terms.");
  };

  const handleDisagree = () => {
    setAgreedToTerms(false);
    setShowAgreementModal(false);
    setError("You must agree to the Terms and Conditions to log in.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear any previous errors

    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions to log in.");
      return;
    }

    try {
      const success = await handleLogin(username, password);
      if (success) {
        navigate("/Dashboard"); // Navigate on successful login
      }
    } catch (err) {
      setError(err.message); // Set error message from handleLogin
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        {/* Left: Image and System Title */}
        <div className="login-image-section">
          <div className="system-title">
            <FontAwesomeIcon icon={faCar} />
            APARKR
          </div>
        </div>
        {/* Right: Login Form */}
        <div className="input-container">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <div className="input-container-child">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label htmlFor="password">Password</label>
              <div className="password-box">
                <input
                  placeholder="Password"
                  type={displayPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FontAwesomeIcon
                  onClick={handleClick}
                  icon={displayPassword ? faEyeSlash : faEye}
                  className="fa-icon"
                />
              </div>
              <div
                className="terms-and-conditions centered-text clickable-text"
                onClick={handleTermsClick}
              >
                Terms and Condition
              </div>
              <button
                type="submit"
                disabled={!agreedToTerms}
                className={!agreedToTerms ? "login-button-disabled" : ""}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {showTermsModal && (
        <div className="modal fade-in">
          <div className="modal-content rounded-corners scrollable-content">
            <span className="close-button" onClick={handleCloseTermsModal}>
              &times;
            </span>
            {/* Inject the terms and conditions content here */}
            <div
              dangerouslySetInnerHTML={{ __html: termsAndConditionsContent }}
            />
            <div className="modal-actions">
              <button className="next-button" onClick={handleNextToAgreement}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showAgreementModal && (
        <div className="modal fade-in">
          <div className="modal-content rounded-corners">
            <span className="close-button" onClick={handleCloseAgreementModal}>
              &times;
            </span>
            <div>
              <ul>
                <li>
                  Acknowledge that you have read and understood these Terms and
                  Conditions, including the Privacy Policy, which is
                  incorporated herein by reference.
                </li>
                <li>
                  Agree to be bound by these Terms and Conditions, which are
                  intended to comply with applicable laws and regulations of the
                  Philippines.
                </li>
              </ul>
              <p>
                If you do not agree to these terms, you must not use this
                website. Your continued use of the website following the posting
                of changes to these terms will mean you accept those changes.
              </p>
            </div>
            <div className="modal-actions">
              <button className="disagree-button" onClick={handleDisagree}>
                Disagree
              </button>
              <button className="agree-button" onClick={handleAgree}>
                Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

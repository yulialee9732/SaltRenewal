import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Auth.css';

const EmployeeRegister = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [employeeCode, setEmployeeCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { name, username, password, confirmPassword, phone } = formData;

  const handleVerifyCode = async () => {
    if (!employeeCode) { setCodeError('코드를 입력해주세요'); return; }
    setVerifyingCode(true);
    setCodeError('');
    try {
      const res = await authAPI.verifyEmployeeCode(employeeCode);
      if (res.data.valid) {
        setCodeVerified(true);
        setCodeError('');
      } else {
        setCodeVerified(false);
        setCodeError('인증 코드가 올바르지 않습니다');
      }
    } catch (err) {
      setCodeVerified(false);
      setCodeError('인증 코드가 올바르지 않습니다');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecial: false
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time password validation
    if (name === 'password') {
      setPasswordChecks({
        minLength: value.length >= 6,
        hasNumber: /\d/.test(value),
        hasLetter: /[a-zA-Z]/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }

    // Reset username availability when username changes
    if (name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsernameAvailability = async () => {
    if (!username || username.length < 3) {
      setError('아이디는 최소 3자 이상이어야 합니다');
      return;
    }

    setCheckingUsername(true);
    setError('');

    try {
      const response = await authAPI.checkUsername(username);
      setUsernameAvailable(response.data.available);
      
      if (!response.data.available) {
        setError('이미 사용 중인 아이디입니다');
      }
    } catch (err) {
      console.error('Username check error:', err);
      setError('아이디 확인 중 오류가 발생했습니다');
    } finally {
      setCheckingUsername(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!employeeCode) {
      setError('직원 인증 코드를 입력해주세요');
      return;
    }

    if (!usernameAvailable) {
      setError('아이디 중복확인을 해주세요');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasNumber || !passwordChecks.hasLetter) {
      setError('비밀번호 조건을 모두 만족해야 합니다');
      return;
    }

    setLoading(true);

    const result = await register({ 
      name, 
      username,
      password, 
      role: 'employee',
      employeeCode,
      phone
    });
    
    if (result.success) {
      if (result.pending) {
        setSuccessMessage(result.message);
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>직원 회원가입</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0099b0', marginBottom: '12px' }}>{successMessage}</p>
            <p style={{ color: '#666', marginBottom: '24px' }}>승인 후 다시 로그인해 주세요.</p>
            <Link to="/login" className="btn btn-primary">로그인 페이지로</Link>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
          {/* Employee verification code */}
          <div className="form-group">
            <label>직원 인증 코드</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <input
                type="password"
                value={employeeCode}
                onChange={(e) => { setEmployeeCode(e.target.value); setCodeVerified(false); setCodeError(''); }}
                className="form-control"
                placeholder="인증 코드를 입력하세요"
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifyingCode || !employeeCode}
                style={{
                  padding: '0 16px',
                  backgroundColor: codeVerified ? '#28a745' : '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: verifyingCode || !employeeCode ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: verifyingCode || !employeeCode ? 0.6 : 1,
                  alignSelf: 'stretch',
                  fontSize: 'inherit'
                }}
              >
                {verifyingCode ? '확인 중...' : codeVerified ? '✓ 확인됨' : '확인'}
              </button>
            </div>
            {codeError && <small style={{ color: 'red', marginTop: '4px', display: 'block' }}>{codeError}</small>}
            {codeVerified && <small style={{ color: '#28a745', marginTop: '4px', display: 'block' }}>✓ 인증 코드가 확인되었습니다</small>}
          </div>

          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>아이디</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="username"
                value={username}
                onChange={onChange}
                className="form-control"
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={checkUsernameAvailability}
                disabled={checkingUsername || !username}
                style={{
                  padding: '0 16px',
                  backgroundColor: usernameAvailable === true ? '#28a745' : '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: checkingUsername || !username ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: checkingUsername || !username ? 0.6 : 1,
                  alignSelf: 'stretch',
                  fontSize: 'inherit'
                }}
              >
                {checkingUsername ? '확인중...' : usernameAvailable === true ? '✓ 확인됨' : '중복확인'}
              </button>
            </div>
            {usernameAvailable === true && (
              <small style={{ color: 'green' }}>✓ 사용 가능한 아이디입니다</small>
            )}
            {usernameAvailable === false && (
              <small style={{ color: 'red' }}>✗ 이미 사용 중인 아이디입니다</small>
            )}
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              className="form-control"
              required
            />
            <div className="password-requirements" style={{ marginTop: '10px', fontSize: '14px' }}>
              <div style={{ color: passwordChecks.minLength ? 'green' : 'red' }}>
                {passwordChecks.minLength ? '✓' : '✗'} 최소 6자 이상
              </div>
              <div style={{ color: passwordChecks.hasNumber ? 'green' : 'red' }}>
                {passwordChecks.hasNumber ? '✓' : '✗'} 숫자 포함
              </div>
              <div style={{ color: passwordChecks.hasLetter ? 'green' : 'red' }}>
                {passwordChecks.hasLetter ? '✓' : '✗'} 문자 포함
              </div>
              <div style={{ color: passwordChecks.hasSpecial ? 'green' : 'red' }}>
                {passwordChecks.hasSpecial ? '✓' : '✗'} 특수문자 포함 (권장)
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              className="form-control"
              required
            />
            {confirmPassword && (
              <div style={{ marginTop: '5px', fontSize: '14px' }}>
                {password === confirmPassword ? (
                  <span style={{ color: 'green' }}>✓ 비밀번호가 일치합니다</span>
                ) : (
                  <span style={{ color: 'red' }}>✗ 비밀번호가 일치하지 않습니다</span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>전화번호</label>
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={onChange}
              className="form-control"
              placeholder="010-1234-5678"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        )}

        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
        <p className="auth-link">
          <Link to="/register">고객 회원가입으로 이동</Link>
        </p>
      </div>
    </div>
  );
};

export default EmployeeRegister;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Auth.css';

const CustomerRegister = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { name, username, password, confirmPassword, phone, verificationCode } = formData;

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecial: false
  });

  const CORRECT_CODE = '15220687';

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

    if (verificationCode !== CORRECT_CODE) {
      setError('고객인증코드가 올바르지 않습니다');
      return;
    }

    setLoading(true);

    const result = await register({ 
      name, 
      username,
      password, 
      role: 'customer', 
      phone
    });
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>회원가입</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={onSubmit}>
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
                className="btn btn-secondary"
                disabled={checkingUsername || !username}
              >
                {checkingUsername ? '확인중...' : '중복확인'}
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

          <div className="form-group">
            <label>고객인증코드</label>
            <input
              type="text"
              name="verificationCode"
              value={verificationCode}
              onChange={onChange}
              className="form-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
        <p className="auth-link">
          <Link to="/register/employee">임직원 회원가입으로 이동</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;

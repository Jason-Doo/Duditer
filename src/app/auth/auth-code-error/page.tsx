import Link from 'next/link';

export default function AuthCodeErrorPage() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px',
            background: '#f9f9f9',
            fontFamily: 'inherit'
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#333' }}>인증 오류가 발생했습니다 😕</h1>
            <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.6 }}>
                인증 코드가 만료되었거나 설정에 문제가 있을 수 있습니다.<br />
                잠시 후 다시 시도해 주세요.
            </p>
            <Link
                href="/login"
                style={{
                    padding: '12px 24px',
                    background: '#6d5dfc',
                    color: 'white',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'opacity 0.2s'
                }}
            >
                로그인 페이지로 돌아가기
            </Link>
        </div>
    );
}

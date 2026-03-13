'use client';

import { useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from '../app/page.module.css';

interface ModalLayoutProps {
    /** 
     * 모달/페이지 닫기 핸들러 (오버레이 백그라운드 클릭 시 호출됨) 
     * 주의: 내부 콘텐츠 클릭 시에는 닫히지 않도록 e.stopPropagation()이 이미 적용되어 있습니다.
     */
    onClose?: () => void;

    /** 모달 헤더 중앙의 제목 문자열 또는 React 노드 */
    title?: ReactNode;

    /** 헤더 좌측에 들어갈 요소 (주로 `<button><ChevronLeft/></button>` 형태의 뒤로가기 버튼) */
    headerLeft?: ReactNode;

    /** 헤더 우측에 들어갈 요소 (주로 '다음 단계', '생성하기' 등의 액션 버튼) */
    headerRight?: ReactNode;

    /** 페이지 전체를 덮는 플랫한 모드인지, 아니면 둥근 모서리가 있는 팝업형 모달인지 여부 */
    isPage?: boolean;

    /** 팝업형 모달일 경우 최대 너비 지정 (예: '800px', '1200px') */
    maxWidth?: string;

    /** 모달 바디(중앙 영역)에 들어갈 컨텐츠 */
    children: ReactNode;

    /** 하단에 고정되는 푸터 영역 (선택사항, 예: 다운로드/공유 등 바텀 액션바) */
    footer?: ReactNode;

    /** 본문 영역 추가 패딩 설정 등 인라인 스타일 (선택사항) */
    bodyStyle?: React.CSSProperties;
}

export default function ModalLayout({
    onClose,
    title,
    headerLeft,
    headerRight,
    isPage = false,
    maxWidth = '800px',
    children,
    footer,
    bodyStyle,
}: ModalLayoutProps) {
    // Body scroll lock effect
    useEffect(() => {
        const scrollY = window.scrollY;
        // iOS Safari 대응을 위해 body 스크롤 방지 로직 고도화
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    // 모달 팝업 형태의 겉 래퍼(배경)와 실제 컨텐츠 박스 스타일 분기
    const overlayProps = isPage
        ? {}
        : {
            className: styles.modalOverlay,
            onClick: onClose // 배경 클릭 시 닫기
        };

    const contentInitial = isPage ? { opacity: 0 } : { opacity: 0, scale: 0.95 };
    const contentAnimate = { opacity: 1, scale: 1 };
    const contentExit = isPage ? { opacity: 0 } : { opacity: 0, scale: 0.95 };

    const contentClass = isPage ? styles.wizardPage : styles.modalContent;

    const contentStyle: React.CSSProperties = isPage
        ? { maxWidth: 'none', borderRadius: 0, background: 'white', display: 'flex', flexDirection: 'column' }
        : { maxWidth: maxWidth, width: '90%', display: 'flex', flexDirection: 'column', maxHeight: '90vh' };

    return (
        <div {...overlayProps} style={isPage ? { width: '100%', minHeight: '100vh', background: 'white' } : {}}>
            <motion.div
                initial={contentInitial}
                animate={contentAnimate}
                exit={contentExit}
                className={contentClass}
                style={contentStyle}
                // 실제 모달 안쪽을 클릭했을 때는 배경의 onClose가 발동하지 않도록 이벤트 버블링 차단
                onClick={isPage ? undefined : (e) => e.stopPropagation()}
            >
                {/* 1. Header Area */}
                <div
                    className={styles.modalHeader}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '120px 1fr 120px', // 헤더 좌/우 너비를 고정하여 중앙 title이 정확히 가운데 오도록 함
                        alignItems: 'center',
                        borderBottom: '1.5px solid rgba(0,0,0,0.05)',
                        padding: isPage ? '1.2rem var(--page-padding)' : '1.2rem 2.5rem',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        background: 'var(--bg-secondary)',
                    }}
                >
                    {/* Header Left */}
                    <div style={{ justifySelf: 'start', display: 'flex', alignItems: 'center' }}>
                        {headerLeft}
                    </div>

                    {/* Header Center (Title) */}
                    <div style={{ textAlign: 'center', overflow: 'hidden' }}>
                        {typeof title === 'string' ? (
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {title}
                            </h2>
                        ) : (
                            title
                        )}
                    </div>

                    {/* Header Right */}
                    <div style={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {headerRight}
                    </div>
                </div>

                {/* 2. Body / Content Area */}
                <div
                    className={styles.modalBody}
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: isPage ? '4rem var(--page-padding)' : '2.5rem',
                        overflowY: 'auto',
                        ...bodyStyle
                    }}
                >
                    {children}
                </div>

                {/* 3. Footer Area (Optional) */}
                {footer && (
                    <div style={{
                        padding: '1.5rem 2rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        background: 'var(--bg-secondary)',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 100,
                        borderBottomLeftRadius: isPage ? '0' : 'inherit',
                        borderBottomRightRadius: isPage ? '0' : 'inherit'
                    }}>
                        {footer}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

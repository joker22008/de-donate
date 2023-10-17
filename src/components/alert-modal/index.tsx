import { FC } from 'react'
import { Modal, Text, Title } from '@delab-team/de-ui'

import s from './alert-modal.module.scss'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    content: React.ReactNode | React.ReactNode[]
}

const alertModalTg = { modalContent: { background: '#fff' }, closeButton: { color: '#000' } }

export const AlertModal: FC<AlertModalProps> = ({
    isOpen,
    onClose,
    content
}) => (
    <Modal isOpen={isOpen} onClose={onClose} className={s.alertModal} tgStyles={alertModalTg}>
        <div className={s.alertModalHeader}>
            <div className={s.alertModalIcon}>
                <i>✔</i>
            </div>
        </div>
        <Title variant='h3' className={s.alertModalTitle} tgStyles={{ color: '#000' }}>Awesome!</Title>
        <div className={s.alertModalContent}>
            <Text tgStyles={{ color: '#000' }}>
                {content}
            </Text>
        </div>
    </Modal>
)

/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button, Input, Modal, Text, Title } from '@delab-team/de-ui'
import { SendTransactionRequest, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react'
import { toNano } from 'ton-core'

import { FundCard } from '../../components/fund-card'
import { Amount } from '../../components/amount'
import { FundDetailSkeleton } from '../../components/fund-detail-skeleton'
import { AlertModal } from '../../components/alert-modal'

import { jettons } from '../../constants/jettons'

import { formatNumberWithCommas } from '../../utils/formatNumberWithCommas'

import { Item, TonApi } from '../../logic/tonapi'
import { Smart } from '../../logic/smart'
import { loadFund } from '../../logic/loadFund'

import { FundDetailType, FundType } from '../../@types/fund'

import s from './fundraiser-detail.module.scss'

import IMG1 from '../../assets/img/01.png'

interface FundraiserDetailProps {
    addressCollection: string[],
    isTestnet: boolean
}

type DataType = {
    amount: string;
    token: string;
}

const editButtonTg = { border: '2px solid #989898', color: '#989898' }

const withdrawalModalTg = { modalContent: { background: '#fff' }, closeButton: { color: '#000' } }
const withdrawalModalInputTg = { input: { background: '#fff', color: '#000', border: '1px solid #B7B7BB' } }

export const FundraiserDetail: FC<FundraiserDetailProps> = ({ addressCollection, isTestnet }) => {
    const { id } = useParams()
    const [ first, setFirst ] = useState<boolean>(false)

    const navigate = useNavigate()

    const rawAddress = useTonAddress(false)

    const [ fundData, setFundData ] = useState<FundType & FundDetailType>({
        addressFund: '',
        amount: 0,
        img: '',
        asset: '',
        target: 0,
        title: '',
        description: '',
        daysTarget: 0,
        daysPassed: 0,
        ownerAddress: '',
        type: 0
    })

    // Success donate modal
    const [ isDonated, setIsDonated ] = useState<boolean>(false)

    // Withdrawal modal
    const [ isWithdrawal, setIsWithdrawal ] = useState<boolean>(false)

    const [ withdrawalData, setWithdrawalData ] = useState<Record <string, string>>({
        address: rawAddress,
        amount: '',
        asset: 'TOH'
    })

    const [ jettonWithdrawal, setJettonWithdrawal ] = useState<string>(jettons[0].value)

    const jettonSelectWithdrawal = (value: string) => {
        setJettonWithdrawal(value)
        setWithdrawalData({
            ...withdrawalData,
            asset: value
        })
    }

    // Withdrawal modal end

    const [ loading, setLoading ] = useState<boolean>(false)

    const [ tonConnectUI, setOptions ] = useTonConnectUI()

    const [ data, setData ] = useState<DataType>({
        amount: '',
        token: 'TON'
    })

    const [ selectedValue, setSelectedValue ] = useState<string>(jettons[0].value)

    const handleSelect = (value: string) => {
        setSelectedValue(value)
        setData({
            ...data,
            token: value
        })
    }

    const isOwnFund = rawAddress === fundData.ownerAddress

    async function donate () {
        // const smart = new Smart(tonConnectUI, true)

        if (id) {
            const tx: SendTransactionRequest = {
                validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec
                messages: [
                    {
                        address: id,
                        amount: toNano(data.amount).toString()
                    }
                ]
            }
            tonConnectUI.sendTransaction(tx).then(() => setIsDonated(true))
        }
    }

    useEffect(() => {
        if (!first) {
            if (!id) {
                return
            }
            setFirst(true)
            setLoading(true)

            const api = new TonApi(isTestnet ? 'testnet' : 'mainnet')

            const smart = new Smart(tonConnectUI, true)

            api.getItemV2(id).then(async (item: Item | undefined) => {
                if (item) {
                    const addressFund = id

                    if (addressFund === undefined) {
                        return
                    }

                    const fund = await loadFund(id, smart, item.owner?.address ?? '',  { daysPassed: true,  daysTarget: true, description: true })

                    if (!fund) {
                        navigate('/')
                        return
                    }
                    setFundData(fund as FundType & FundDetailType)

                    setTimeout(() => {
                        setLoading(false)
                    }, 200)
                }
            }).catch(async (error) => {
                const fund = await loadFund(id, smart, '')

                if (!fund) {
                    navigate('/')
                    return
                }
                setFundData(fund as FundType & FundDetailType)

                setTimeout(() => {
                    setLoading(false)
                }, 200)
                console.log(error)
                // navigate('/')
            })
        }

        return () => {
            setFundData({
                addressFund: '',
                amount: 0,
                img: '',
                asset: '',
                target: 0,
                title: '',
                description: '',
                daysTarget: 0,
                daysPassed: 0,
                ownerAddress: '',
                type: 0
            })
        }
    }, [ id ])

    return (
        <div className={s.inner}>
            {isDonated && (
                <AlertModal isOpen={isDonated} onClose={() => setIsDonated(false)} content={<Text tgStyles={{ color: '#000' }} className={s.textModal}>The <span>{fundData.title}</span> fund has been successfully donated!</Text>}  />
            )}
            {isWithdrawal && (
                <Modal isOpen={isWithdrawal} onClose={() => setIsWithdrawal(false)} tgStyles={withdrawalModalTg}>
                    <div className={s.withdrawalModal}>
                        <Title variant="h5" className={s.withdrawalModalTitle} tgStyles={ { color: '#000' } }>Withdrawal</Title>
                        <Input className={`input ${s.withdrawalModalInput}`} value={rawAddress} variant='black' onChange={() => {}} tgStyles={withdrawalModalInputTg} />
                        <Amount
                            options={jettons}
                            value={String(withdrawalData.amount)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setWithdrawalData({
                                    ...withdrawalData,
                                    amount: e.target.value
                                })
                            }}
                            selectedValue={jettonWithdrawal}
                            handleSelect={jettonSelectWithdrawal}
                            border
                        />
                        <Button
                            rounded="l"
                            size="stretched"
                            className="action-btn"
                            disabled={withdrawalData.amount.length < 1}
                        >
                            Submit
                        </Button>
                    </div>
                </Modal>
            )}
            {loading ? (
                <FundDetailSkeleton />
            ) : (
                <FundCard
                    title={fundData.title}
                    target={fundData.target}
                    img={fundData.img || IMG1}
                    amount={fundData.amount}
                    daysTarget={fundData.daysTarget}
                    daysPassed={fundData.daysPassed}
                    formatNumberWithCommas={formatNumberWithCommas}
                    description={fundData.description}
                    fundType={fundData.type}
                />
            )}

            <div className={s.innerActions}>
                <div className={s.amountInner}>
                    <Amount
                        options={jettons}
                        value={String(data.amount)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setData({
                                ...data,
                                amount: e.target.value
                            })
                        }}
                        selectedValue={selectedValue}
                        handleSelect={handleSelect}
                    />
                </div>
                <Button
                    rounded="l"
                    size="stretched"
                    className="action-btn"
                    disabled={data.amount.length < 1}
                    onClick={() => (rawAddress ? donate() : tonConnectUI.connectWallet())}
                >
                    Donate Now
                </Button>
            </div>

            {isOwnFund && (
                <div className={s.actionsButtons}>
                    <Button
                        className={s.editButton}
                        onClick={() => navigate(`/fundraiser-update/${id}`)}
                        tgStyles={editButtonTg}
                    >
                        Edit
                    </Button>
                    <Button className={s.editButton} onClick={() => setIsWithdrawal(true)}
                        tgStyles={editButtonTg}
                    >
                        Withdrawal
                    </Button>
                </div>
            )}
        </div>
    )
}

import { useState, useEffect } from 'react'

type PricingSettings = {
  donation_preset_1_amount: number
  donation_preset_1_label: string
  donation_preset_2_amount: number
  donation_preset_2_label: string
  donation_preset_3_amount: number
  donation_preset_3_label: string
  donation_page_title: string
  donation_page_desc: string
  verified_monthly_price: number
  verified_yearly_price: number
  ad_basic_price: number
  ad_basic_days: number
  ad_pro_price: number
  ad_pro_days: number
  advertise_page_title: string
  advertise_page_desc: string
}

const DEFAULTS: PricingSettings = {
  donation_preset_1_amount: 99,
  donation_preset_1_label: 'Buy us a chai ☕',
  donation_preset_2_amount: 199,
  donation_preset_2_label: 'Support our servers 🖥',
  donation_preset_3_amount: 499,
  donation_preset_3_label: 'Fuel AI creativity 🚀',
  donation_page_title: 'Support AiCreatorFeed',
  donation_page_desc: "We're a community-first platform for AI creators. Your donation helps us keep the platform free, improve features, and pay for servers.",
  verified_monthly_price: 299,
  verified_yearly_price: 1999,
  ad_basic_price: 999,
  ad_basic_days: 7,
  ad_pro_price: 2999,
  ad_pro_days: 30,
  advertise_page_title: 'Advertise on AiCreatorFeed',
  advertise_page_desc: 'Reach thousands of AI creators, artists, and prompt engineers.',
}

export function usePricingSettings(): { pricing: PricingSettings; loading: boolean } {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        const s = d.settings || {}
        const merged: PricingSettings = { ...DEFAULTS }
        const keys = Object.keys(DEFAULTS) as (keyof PricingSettings)[]
        keys.forEach(key => {
          const sKey = `pricing_${key}`
          if (s[sKey] !== undefined && s[sKey] !== '') {
            const def = DEFAULTS[key]
            if (typeof def === 'number') {
              (merged as any)[key] = parseFloat(s[sKey]) || def
            } else {
              (merged as any)[key] = s[sKey]
            }
          }
        })
        setPricing(merged)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { pricing, loading }
}

export default DEFAULTS

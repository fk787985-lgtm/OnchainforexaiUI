import { kycSection, kycSectionTitle } from '../styles/kycUi'

export default function KycSection({ title, children, className = '' }) {
  return (
    <section className={`${kycSection} ${className}`}>
      {title ? <h2 className={kycSectionTitle}>{title}</h2> : null}
      {children}
    </section>
  )
}

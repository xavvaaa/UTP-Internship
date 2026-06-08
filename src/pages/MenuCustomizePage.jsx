/**
 * Grab-style: pick meal on list, then customize optional sections.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, LogOut, AlertCircle } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import PlaceOrderBar from '../components/menu/PlaceOrderBar'
import OrderSummary from '../components/passenger/OrderSummary'
import RadioPickSection from '../components/passenger/RadioPickSection'
import StatusTracker from '../components/passenger/StatusTracker'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { useSession } from '../context/useSession'
import { firebaseConfigured } from '../firebase/config'
import { usePassengerMenu } from '../hooks/usePassengerMenu'
import { useOrderForSession } from '../hooks/useOrderForSession'
import { isItemSelectable } from '../services/menuService'
import { placeOrderTransaction } from '../services/passengerOrderService'
import styles from './MenuCustomizePage.module.css'

const CATEGORY_ORDER = ['drink', 'dessert', 'snack']
function buildRadioOptions(items) {
  const opts = [{ value: '', label: 'None', disabled: false }]
  for (const item of items) {
    const ok = item.isInlineOption ? true : isItemSelectable(item)
    opts.push({
      value: item.value ?? item.id,
      label: ok ? item.name : `${item.name} (out of stock)`,
      disabled: !ok,
    })
  }
  return opts
}

function filterOptionsForMeal(meal, category, allItems) {
  const inlineKey = `${category}Options`
  const inline = meal?.[inlineKey]
  if (Array.isArray(inline) && inline.length) {
    return inline.map((name) => ({
      id: '',
      value: `inline:${category}:${name}`,
      name: String(name),
      isInlineOption: true,
    }))
  }
  const key = `${category}Ids`
  const configuredIds = meal?.[key]
  if (!Array.isArray(configuredIds)) return allItems
  if (!configuredIds.length) return []
  const allowed = new Set(configuredIds)
  return allItems.filter((item) => allowed.has(item.id))
}

function getSectionTitle(meal, category) {
  const key = `${category}Label`
  const value = String(meal?.[key] ?? '').trim()
  if (value) return value
  if (category === 'drink') return 'Drinks'
  if (category === 'dessert') return 'Desserts'
  return 'Snacks'
}

export default function MenuCustomizePage() {
  const { mealId } = useParams()
  const navigate = useNavigate()
  const { sessionId, seatNumber, clearSession } = useSession()
  const { menuItems, menuLoading, menuError } = usePassengerMenu(sessionId)
  const { liveOrder, orderSubError } = useOrderForSession(sessionId, seatNumber)

  const [drinkChoice, setDrinkChoice] = useState('')
  const [dessertChoice, setDessertChoice] = useState('')
  const [snackChoice, setSnackChoice] = useState('')
  const [notes, setNotes] = useState('')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const meal = useMemo(
    () =>
      menuItems.find((m) => m.id === mealId && String(m.category).toLowerCase() === 'meal') ?? null,
    [menuItems, mealId],
  )

  const byCategory = useMemo(() => {
    const map = {}
    for (const item of menuItems) {
      const key = String(item.category || 'meal').toLowerCase()
      if (key === 'meal') continue
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [menuItems])

  useEffect(() => {
    if (!firebaseConfigured) return
    if (menuLoading) return
    if (!mealId) {
      navigate('/menu')
      return
    }
    if (!menuItems.length) {
      navigate('/menu')
      return
    }
    const found = menuItems.some(
      (m) => m.id === mealId && String(m.category).toLowerCase() === 'meal',
    )
    if (!found) navigate('/menu')
  }, [mealId, menuItems, menuLoading, navigate])

  const drinkMeta = useMemo(() => menuItems.find((m) => m.id === drinkChoice), [menuItems, drinkChoice])
  const dessertMeta = useMemo(
    () => menuItems.find((m) => m.id === dessertChoice),
    [menuItems, dessertChoice],
  )
  const snackMeta = useMemo(() => menuItems.find((m) => m.id === snackChoice), [menuItems, snackChoice])

  function readChoiceName(choice, fallbackMeta) {
    if (!choice) return ''
    if (choice.startsWith('inline:')) return choice.split(':').slice(2).join(':')
    return fallbackMeta?.name || ''
  }

  function handleLeave() {
    setShowExitConfirm(true)
  }

  function confirmLeave() {
    clearSession()
    navigate('/')
  }

  async function handlePlaceOrder() {
    if (!meal || liveOrder || !seatNumber || !sessionId) return
    setOrderError('')
    setOrderLoading(true)
    try {
      await placeOrderTransaction({
        sessionId,
        seatNumber,
        mealId: meal.id,
        drinkId: drinkChoice && !drinkChoice.startsWith('inline:') ? drinkChoice : '',
        dessertId: dessertChoice && !dessertChoice.startsWith('inline:') ? dessertChoice : '',
        snackId: snackChoice && !snackChoice.startsWith('inline:') ? snackChoice : '',
        mealName: meal.name,
        drinkName: readChoiceName(drinkChoice, drinkMeta),
        dessertName: readChoiceName(dessertChoice, dessertMeta),
        snackName: readChoiceName(snackChoice, snackMeta),
        notes: notes.trim(),
      })
      navigate('/menu')
    } catch (e) {
      setOrderError(e?.message ?? 'Order failed.')
    } finally {
      setOrderLoading(false)
    }
  }

  const orderLocked = Boolean(liveOrder)
  const canSubmit = Boolean(
    meal && seatNumber && !orderLocked && !menuError && !menuLoading && isItemSelectable(meal),
  )
  const selectedExtras = [drinkChoice, dessertChoice, snackChoice].filter(Boolean).length

  function clearOptionalChoices() {
    setDrinkChoice('')
    setDessertChoice('')
    setSnackChoice('')
  }

  return (
    <PageShell
      hideHeader
      footer={
        <PlaceOrderBar
          disabled={!canSubmit}
          loading={orderLoading}
          onPlaceOrder={handlePlaceOrder}
          lockedMessage={orderLocked ? 'Your order is being prepared. Track status below.' : null}
        />
      }
    >
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate('/menu')}
          aria-label="Back to menu"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <span className={styles.topTitle}>Customize order</span>
        <button
          type="button"
          className={styles.topAction}
          onClick={handleLeave}
          aria-label="End session"
        >
          <LogOut size={20} strokeWidth={2} />
        </button>
      </div>

      {menuError && firebaseConfigured ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {menuError}
        </p>
      ) : null}

      {orderSubError ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {orderSubError}
        </p>
      ) : null}

      {orderError ? (
        <p className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {orderError}
        </p>
      ) : null}

      {menuLoading && firebaseConfigured && !menuError ? (
        <p className={styles.centerMuted}>
          <Loader2 className={styles.spin} size={18} aria-hidden />
          Loading
        </p>
      ) : null}

      {liveOrder ? <StatusTracker order={liveOrder} menuItems={menuItems} /> : null}

      {!orderLocked && meal && !menuLoading ? (
        <>
          <div className={styles.hero}>
            {meal.imageUrl ? (
              <img className={styles.heroImg} src={meal.imageUrl} alt="" />
            ) : (
              <div className={styles.heroPh} aria-hidden />
            )}
            <div className={styles.heroText}>
              <h1 className={styles.mealTitle}>{meal.name}</h1>
              {meal.description ? <p className={styles.mealDesc}>{meal.description}</p> : null}
            </div>
          </div>

          {!seatNumber ? (
            <p className={styles.warn}>Save your seat on the previous screen before placing an order.</p>
          ) : null}

          <OrderSummary
            seatNumber={seatNumber}
            meal={meal.name}
            drink={drinkChoice ? readChoiceName(drinkChoice, drinkMeta) : null}
            dessert={dessertChoice ? readChoiceName(dessertChoice, dessertMeta) : null}
            snack={snackChoice ? readChoiceName(snackChoice, snackMeta) : null}
          />

          <section className={styles.notesPanel} aria-labelledby="passenger-notes-title">
            <label className={styles.notesLabel} htmlFor="passenger-notes">
              <span id="passenger-notes-title">Preferences or allergy notes</span>
              <textarea
                id="passenger-notes"
                className={styles.notesInput}
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 300))}
                maxLength={300}
                rows={4}
                placeholder="Example: No peanuts, lactose intolerant, no ice, vegetarian preference..."
              />
            </label>
            <div className={styles.notesMeta}>
              <span>Please tell cabin crew directly about severe allergies.</span>
              <span>{notes.length}/300</span>
            </div>
          </section>

          <div className={styles.choiceIntro}>
            <div>
              <span className={styles.choiceKicker}>Optional choices</span>
              <p>
                {selectedExtras
                  ? `${selectedExtras} extra ${selectedExtras === 1 ? 'choice' : 'choices'} selected`
                  : 'No extras selected yet'}
              </p>
            </div>
            {selectedExtras ? (
              <button type="button" className={styles.clearChoices} onClick={clearOptionalChoices}>
                Reset extras
              </button>
            ) : null}
          </div>

          <div className={styles.groups}>
            {CATEGORY_ORDER.map((cat) => {
              const items = filterOptionsForMeal(meal, cat, byCategory[cat] ?? [])
              if (!items.length) return null
              const value =
                cat === 'drink' ? drinkChoice : cat === 'dessert' ? dessertChoice : snackChoice
              const onChange =
                cat === 'drink'
                  ? setDrinkChoice
                  : cat === 'dessert'
                    ? setDessertChoice
                    : setSnackChoice
              return (
                <RadioPickSection
                  key={cat}
                  title={getSectionTitle(meal, cat)}
                  name={`pick-${cat}`}
                  options={buildRadioOptions(items)}
                  value={value}
                  onChange={onChange}
                  disabled={orderLocked}
                />
              )
            })}
          </div>
        </>
      ) : null}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Exit passenger session?"
        message="Are you sure you want to exit? This will remove your saved flight and seat from this device, so you will need the access code again to rejoin."
        confirmText="Exit session"
        cancelText="Stay here"
        type="warning"
        onConfirm={confirmLeave}
        onCancel={() => setShowExitConfirm(false)}
      />
    </PageShell>
  )
}

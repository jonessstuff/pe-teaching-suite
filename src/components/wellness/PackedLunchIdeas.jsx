import { useMemo, useState } from 'react'
import { Apple, Clock3, PackageOpen, RefreshCw, Snowflake, UtensilsCrossed } from 'lucide-react'
import { trackToolUsage } from '../../services/productUsageService'

const LUNCHES = [
  { name: 'Hummus Crunch Box', tags: ['no-heat', 'vegetarian', 'five-minute'], items: ['Hummus', 'Whole-grain pita or crackers', 'Cucumber and pepper strips', 'Grapes or berries'], prep: 'Portion everything into a divided container the night before.' },
  { name: 'Turkey Avocado Wrap', tags: ['no-heat', 'five-minute'], items: ['Whole-grain wrap', 'Turkey and sliced cheese', 'Avocado or hummus', 'Spinach', 'Apple'], prep: 'Roll tightly, slice in half, and pack with the apple.' },
  { name: 'Greek Chicken Pasta Jar', tags: ['no-heat'], items: ['Cooked pasta', 'Chicken', 'Cucumber and tomato', 'Feta', 'Greek-style dressing'], prep: 'Put dressing on the bottom, then sturdy ingredients, pasta, and greens on top.' },
  { name: 'Black Bean Taco Bowl', tags: ['microwave', 'vegetarian'], items: ['Brown rice', 'Black beans', 'Corn and salsa', 'Shredded cheese', 'Mandarin orange'], prep: 'Pack the orange separately and add salsa after reheating.' },
  { name: 'Chicken & Veggie Comfort Bowl', tags: ['microwave'], items: ['Rice or quinoa', 'Cooked chicken', 'Roasted or frozen vegetables', 'Favorite sauce', 'Pear'], prep: 'Use dinner leftovers and portion one serving before cleanup.' },
  { name: 'Lentil Harvest Bowl', tags: ['microwave', 'vegetarian'], items: ['Cooked lentils', 'Sweet potato', 'Spinach', 'Pumpkin or sunflower seeds', 'Simple vinaigrette'], prep: 'Layer in a microwave-safe container and add the vinaigrette after warming.' },
  { name: 'Egg & Avocado Snack Plate', tags: ['no-heat', 'vegetarian', 'five-minute'], items: ['Two cooked eggs', 'Avocado', 'Whole-grain crackers', 'Cherry tomatoes', 'Orange slices'], prep: 'Use pre-cooked eggs and pack the avocado with a squeeze of lemon.' },
  { name: 'Sunflower Butter Banana Roll-Up', tags: ['no-heat', 'vegetarian', 'five-minute'], items: ['Whole-grain wrap', 'Sunflower seed butter', 'Banana', 'Plain yogurt', 'Carrot sticks'], prep: 'Roll the banana inside the wrap and slice into easy-to-eat rounds.' },
]

const FILTERS = [
  { id: 'all', label: 'All ideas' },
  { id: 'five-minute', label: '5-minute prep' },
  { id: 'no-heat', label: 'No reheating' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'microwave', label: 'Microwave' },
]

const DESK_SNACKS = [
  { name: 'Apple + sunflower seed butter packet', detail: 'Easy to store and simple to replace each week.', storage: 'desk' },
  { name: 'Roasted chickpeas + dried fruit', detail: 'Portion a small handful of each into a reusable container.', storage: 'desk' },
  { name: 'Whole-grain crackers + tuna or chickpea pouch', detail: 'Choose an easy-open pouch and keep a spare spoon nearby.', storage: 'desk' },
  { name: 'Plain popcorn + pumpkin seeds', detail: 'Pack separately if you want both to stay crisp.', storage: 'desk' },
  { name: 'Oatmeal cup + shelf-stable fruit cup', detail: 'A useful option if you have access to hot water.', storage: 'desk' },
  { name: 'Whole-grain snack bar + clementine', detail: 'Check the label for ingredients that fit your needs.', storage: 'desk' },
  { name: 'Greek yogurt + berries', detail: 'Pack in an insulated lunch bag or keep in a refrigerator.', storage: 'cold' },
  { name: 'Cheese stick + pear', detail: 'Keep the cheese chilled until you are ready to eat.', storage: 'cold' },
  { name: 'Hummus cup + vegetables', detail: 'Pre-cut vegetables make this easy to grab between duties.', storage: 'cold' },
]

export default function PackedLunchIdeas() {
  const [filter, setFilter] = useState('all')
  const [offset, setOffset] = useState(0)
  const [snackStorage, setSnackStorage] = useState('desk')
  const [snackOffset, setSnackOffset] = useState(0)
  const [dayNumber] = useState(() => Math.floor(Date.now() / 86_400_000))
  const options = useMemo(() => filter === 'all' ? LUNCHES : LUNCHES.filter((lunch) => lunch.tags.includes(filter)), [filter])
  const lunch = options[(dayNumber + offset) % options.length]
  const snackOptions = DESK_SNACKS.filter((snack) => snack.storage === snackStorage)
  const snack = snackOptions[(dayNumber + snackOffset) % snackOptions.length]

  function chooseFilter(id) {
    setFilter(id)
    setOffset(0)
  }

  function showAnother() {
    setOffset((current) => current + 1)
    void trackToolUsage('teacher-packed-lunch-ideas', 'another_idea', { moduleLabel: 'Teacher Health & Wellness', metadata: { filter } })
  }

  function chooseSnackStorage(value) {
    setSnackStorage(value)
    setSnackOffset(0)
  }

  function showAnotherSnack() {
    setSnackOffset((current) => current + 1)
    void trackToolUsage('teacher-desk-snack-ideas', 'another_idea', { moduleLabel: 'Teacher Health & Wellness', metadata: { storage: snackStorage } })
  }

  return <section className="card overflow-hidden">
    <div className="border-b border-ink-800 bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400"><UtensilsCrossed size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-400">Made for busy school days</p><h2 className="mt-1 text-xl font-bold">Packed Lunch Ideas</h2><p className="mt-1 text-sm text-ink-500">Quick combinations that are easy to pack and realistic to eat during a short lunch period.</p></div></div>
    </div>

    <div className="p-5 sm:p-6">
      <div className="flex flex-wrap gap-2" aria-label="Filter lunch ideas">
        {FILTERS.map((item) => <button key={item.id} type="button" onClick={() => chooseFilter(item.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${filter === item.id ? 'border-teal-400/50 bg-teal-500/15 text-teal-300' : 'border-ink-700 bg-ink-900/40 text-ink-500 hover:text-ink-200'}`}>{item.label}</button>)}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.75fr]">
        <article className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-400">Today’s idea</p><h3 className="mt-1 text-lg font-bold">{lunch.name}</h3></div><button type="button" onClick={showAnother} className="inline-flex items-center gap-2 rounded-xl bg-ink-800 px-3 py-2 text-xs font-bold text-ink-200 hover:bg-ink-700"><RefreshCw size={14} /> Another idea</button></div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {lunch.items.map((item) => <li key={item} className="flex items-center gap-2 rounded-lg bg-ink-950/30 px-3 py-2 text-sm text-ink-300"><Apple size={14} className="shrink-0 text-teal-400" />{item}</li>)}
          </ul>
        </article>

        <aside className="space-y-3">
          <div className="rounded-xl border border-ink-800 bg-ink-900/35 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} className="text-sky-400" /> Prep shortcut</div><p className="mt-2 text-sm leading-6 text-ink-500">{lunch.prep}</p></div>
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Snowflake size={16} className="text-sky-400" /> Pack safely</div><p className="mt-2 text-xs leading-5 text-ink-500">Keep foods that need refrigeration properly chilled until lunchtime. Adjust every idea for your allergies, dietary needs, and medical guidance.</p></div>
        </aside>
      </div>

      <div className="mt-6 border-t border-ink-800 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><PackageOpen size={18} /></span><div><h3 className="font-bold">Desk Snack Stash</h3><p className="mt-0.5 text-sm text-ink-500">Keep one practical option nearby for a busy afternoon.</p></div></div>
          <div className="flex rounded-xl border border-ink-800 bg-ink-950/30 p-1">
            <button type="button" onClick={() => chooseSnackStorage('desk')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${snackStorage === 'desk' ? 'bg-emerald-500/15 text-emerald-400' : 'text-ink-500'}`}>Shelf-stable</button>
            <button type="button" onClick={() => chooseSnackStorage('cold')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${snackStorage === 'cold' ? 'bg-sky-500/15 text-sky-400' : 'text-ink-500'}`}>Keep chilled</button>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-ink-800 bg-ink-900/35 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-ink-200">{snack.name}</p><p className="mt-1 text-xs leading-5 text-ink-500">{snack.detail}</p></div>
          <button type="button" onClick={showAnotherSnack} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink-800 px-3 py-2 text-xs font-bold text-ink-200 hover:bg-ink-700"><RefreshCw size={14} /> Another snack</button>
        </div>
        <p className="mt-3 text-xs leading-5 text-ink-500">Choose foods that match your dietary needs and school allergy rules. Refrigerate perishable foods promptly.</p>
      </div>
    </div>
  </section>
}

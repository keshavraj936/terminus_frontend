import { useState, useEffect } from 'react';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';


interface MenuItem {
  day: string;
  meal_type: string;
  items: string;
  date?: string;
}

export default function Mess() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('get_mess.php')
      .then(r => {
        if (r.data.status === 'success') {
          setMenu(r.data.data);
        }
      })
      .catch(e => console.error("Failed to load mess schedule:", e))
      .finally(() => setLoading(false));
  }, []);

  // Group by day for rendering
  const grouped: Record<string, Record<string, string>> = {};
  menu.forEach(item => {
    if (!grouped[item.day]) grouped[item.day] = {};
    grouped[item.day][item.meal_type] = item.items;
    if (item.date) {
      grouped[item.day].date = item.date;
    }
  });

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealOrder = ['breakfast', 'lunch', 'lunch_international', 'snacks', 'dinner'];
  const mealLabel: Record<string, string> = {
    breakfast: '🌅 Breakfast',
    lunch: '🍱 Lunch',
    lunch_international: '🌍 Intl. Lunch',
    snacks: '🫙 Snacks',
    dinner: '🌙 Dinner'
  };

  return (
    <AnimatedPage>
      <div className="animate-fade-up container" style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                Mess Routine
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Your daily food schedule.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {Array.from({length: 6}).map((_, i) => (
               <div key={i} className="card skeleton" style={{ height: '300px', borderRadius: '20px' }}></div>
            ))}
          </div>
        ) : menu.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center', borderRadius: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Menu Not Available</h3>
            <p style={{ color: 'var(--text-muted)' }}>The administration hasn't uploaded the weekly mess schedule yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {dayOrder.filter(d => grouped[d]).map((day, idx) => (
              <div key={day} className={`animate-fade-up`} style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="card" style={{ borderRadius: '8px', padding: 0, overflow: 'hidden', border: '1px solid var(--border)', height: '100%' }}>
                  <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {day} {grouped[day]?.date && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, opacity: 0.8 }}>({grouped[day].date})</span>}
                    </h3>
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {mealOrder.filter(m => grouped[day][m]).map(meal => (
                      <div key={meal}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          {mealLabel[meal] || meal}
                        </div>
                        <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                          {grouped[day][meal]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}

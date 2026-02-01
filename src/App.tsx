/**
 * WWM Damage Calculator - Main App
 * 
 * Point d'entrée de l'application.
 * Structure à développer avec les composants du calculateur.
 */

import { useCalculatorStore } from './store/calculatorStore';

function App() {
  const { stats, target, lastResult, calculate, selectedSkill } = useCalculatorStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold">
          WWM Damage Calculator
        </h1>
        <p className="text-gray-400 text-sm">
          Calculateur de dégâts pour Where Winds Meet
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stats Panel */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Stats du Personnage</h2>
            
            <div className="space-y-4">
              <div>
                <label className="stat-label">Attaque Externe (Min-Max)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="stat-input"
                    value={stats.attExtMin}
                    readOnly
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    className="stat-input"
                    value={stats.attExtMax}
                    readOnly
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="stat-label">Taux Critique</label>
                <input
                  type="number"
                  className="stat-input"
                  value={(stats.tauxCrit * 100).toFixed(1)}
                  readOnly
                />
              </div>

              <div>
                <label className="stat-label">Taux Affinité</label>
                <input
                  type="number"
                  className="stat-input"
                  value={(stats.tauxAffinite * 100).toFixed(1)}
                  readOnly
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Utilisez Cursor pour ajouter les inputs interactifs
            </p>
          </div>

          {/* Target Panel */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Cible (Boss)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="stat-label">Défense</label>
                <input
                  type="number"
                  className="stat-input"
                  value={target.defense}
                  readOnly
                />
              </div>

              <div>
                <label className="stat-label">Résistance Élémentaire</label>
                <input
                  type="number"
                  className="stat-input"
                  value={target.resistElem}
                  readOnly
                />
              </div>

              <div>
                <label className="stat-label">Bouclier Qi</label>
                <input
                  type="number"
                  className="stat-input"
                  value={target.bouclierQi}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Résultats</h2>
            
            {lastResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Normal</span>
                    <p className="damage-value-normal">
                      {Math.round(lastResult.normal).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Critique</span>
                    <p className="damage-value-critical">
                      {Math.round(lastResult.critical).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Affinité</span>
                    <p className="damage-value-affinity">
                      {Math.round(lastResult.affinity).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Expected Value</span>
                    <p className="damage-value text-primary-400">
                      {Math.round(lastResult.expectedValue).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Breakdown</h3>
                  <div className="text-sm space-y-1">
                    <p>Pool Physique: {Math.round(lastResult.poolPhysique)}</p>
                    <p>Pool Élémentaire: {Math.round(lastResult.poolElementaire)}</p>
                    <p>Réduction Défense: {(lastResult.reductionDefense * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Sélectionnez un skill et cliquez sur Calculer</p>
              </div>
            )}

            <button
              onClick={calculate}
              disabled={!selectedSkill}
              className="btn-primary w-full mt-4"
            >
              Calculer
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-primary-400">🚀 Prêt à développer</h3>
          <p className="text-gray-400 text-sm mt-1">
            Ce template inclut les formules, types, store Zustand et tests.
            Utilisez Cursor pour ajouter les composants manquants (SkillSelect, BuffPanel, etc.)
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;

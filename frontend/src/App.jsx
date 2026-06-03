import Converter from './components/Converter'
import StatsSection from './components/StatsSection'
import Footer from './components/Footer'
import './index.css'

function App() {
  return (
    <div className="app">
      <Converter />
      <StatsSection />
      <Footer />
    </div>
  )
}

export default App
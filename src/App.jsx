import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage.jsx'
import AdminPage from './AdminPage.jsx'
import InfoPage from './InfoPage.jsx'
import AppErrorBoundary from './AppErrorBoundary.jsx'
import BalustradeConfiguratorPage from './BalustradeConfiguratorPage.jsx'
import ShowerConfiguratorPage from './ShowerConfiguratorPage.jsx'
import TerraceConfiguratorPage from './TerraceConfiguratorPage.jsx'
import PergolaConfiguratorPage from './PergolaConfiguratorPage.jsx'
import CopertinaConfiguratorPage from './CopertinaConfiguratorPage.jsx'
import SwingDoorConfiguratorPage from './SwingDoorConfiguratorPage.jsx'
import SlidingDoorConfiguratorPage from './SlidingDoorConfiguratorPage.jsx'
import PartitionConfiguratorPage from './PartitionConfiguratorPage.jsx'
import OglinziConfiguratorPage from './OglinziConfiguratorPage.jsx'
import { PageWithSEO } from './PageWithSEO.jsx'

function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Routes>
          <Route path="/admin"                             element={<PageWithSEO page="admin"><AdminPage /></PageWithSEO>} />
          <Route path="/"                                  element={<PageWithSEO page="home"><HomePage /></PageWithSEO>} />
          <Route path="/despre"                            element={<PageWithSEO page="despre"><InfoPage page="despre" /></PageWithSEO>} />
          <Route path="/portofoliu"                        element={<PageWithSEO page="portofoliu"><InfoPage page="portofoliu" /></PageWithSEO>} />
          <Route path="/contact"                           element={<PageWithSEO page="contact"><InfoPage page="contact" /></PageWithSEO>} />
          <Route path="/configurator/balustrade"           element={<PageWithSEO page="balustrade"><BalustradeConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/cabine-dus"           element={<PageWithSEO page="shower"><ShowerConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/inchidere-terasa"     element={<PageWithSEO page="terrace"><TerraceConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/pergola"              element={<PageWithSEO page="pergola"><PergolaConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/pergole"              element={<PageWithSEO page="pergola"><PergolaConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/pergola-copertina"    element={<PageWithSEO page="pergola"><PergolaConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/copertina"            element={<PageWithSEO page="copertina"><CopertinaConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/usi-batante"          element={<PageWithSEO page="swingDoor"><SwingDoorConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/usi-culisante"        element={<PageWithSEO page="slidingDoor"><SlidingDoorConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/partitionari"         element={<PageWithSEO page="partition"><PartitionConfiguratorPage /></PageWithSEO>} />
          <Route path="/configurator/oglinzi"              element={<PageWithSEO page="oglinzi"><OglinziConfiguratorPage /></PageWithSEO>} />
        </Routes>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
export default App

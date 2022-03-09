import React, { Fragment } from 'react'
import { Router, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'

import Navigation from './components/Navigation'
import Home from './routes/Home'
import About from './routes/About'
import Sample from './routes/Sample'
import Arrival from './routes/Arrival'
import Order from './routes/Order'
import DluoLot from './routes/DluoLot'
import Cadencier from './routes/Cadencier'
import CadencierImport from './routes/CadencierImport'
import Bordereau from './routes/Bordereau'
import HistoriqueClient from './routes/HistoriqueClient'
import Stats from './routes/Stats'
import Inventory from './routes/Inventory'
import InventoryCounting from './routes/InventoryCounting'
import StockPalettes from './routes/StockPalettes'
import Etiquettes from './routes/Etiquettes'
import Unsold from './routes/Unsold'

const rootLabel="Home";
export const App = () => (
  <Fragment>
    <Router history={createBrowserHistory()}>
      <Navigation />
      <Switch>
        <Route exact path="/" component={Home}/>
        <Route path="/about" render={(routeProps => (<About {...routeProps} rootLabel={rootLabel} h1Title="Testing View"/>))}/>
        <Route path="/sample" render={(routeProps => (<Sample {...routeProps} rootLabel={rootLabel} h1Title="Etiquettes"/>))}/>
        <Route path="/arrival" render={(routeProps => (<Arrival {...routeProps} rootLabel={rootLabel} h1Title="Arrivées Prochains TC"/>))}/>
        <Route path="/order" render={(routeProps => (<Order {...routeProps} rootLabel={rootLabel} h1Title="Commande Fournisseur"/>))}/>
        <Route path="/dluolot" render={(routeProps => (<DluoLot {...routeProps} rootLabel={rootLabel} h1Title="Entree des dluos et lots"/>))}/>
        <Route path="/cadencier" render={(routeProps => (<Cadencier {...routeProps} rootLabel={rootLabel} h1Title="Cadencier"/>))}/>
        <Route path="/import" render={(routeProps => (<CadencierImport {...routeProps} rootLabel={rootLabel} h1Title="Cadencier pour l'IMPORT"/>))}/>
        <Route path="/bordereau" render={(routeProps => (<Bordereau {...routeProps} rootLabel={rootLabel} h1Title="Bordereau de remise client"/>))}/>
        <Route path="/historique" render={(routeProps => (<HistoriqueClient {...routeProps} rootLabel={rootLabel} h1Title="Historique Client"/>))}/>
        <Route path="/inventaire" render={(routeProps => (<Inventory {...routeProps} rootLabel={rootLabel} h1Title="Test inventaire"/>))}/>
        <Route path="/counting" render={(routeProps => (<InventoryCounting  {...routeProps} rootLabel={rootLabel} h1Title="Test Comptage"/>))}/>
        <Route path="/palettes" render={(routeProps => (<StockPalettes  {...routeProps} rootLabel={rootLabel} h1Title="Test Palettes"/>))}/>
        <Route path="/etiquettes" render={(routeProps => (<Etiquettes  {...routeProps} rootLabel={rootLabel} h1Title="Test Etiquettes"/>))}/>
        <Route path="/stats" component={Stats}/>
        <Route path="/unsold" render={(routeProps => (<Unsold {...routeProps} rootLabel={rootLabel} h1Title="Invendus Mensuels"/>))}/>

      </Switch>
    </Router>
  </Fragment>
)

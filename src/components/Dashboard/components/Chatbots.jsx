import React, { useState } from 'react';
import axios from 'axios';

import { backend_url } from '../../../util/variables';
import Productivity from './Productivity';
import Header from './Header';
import Categories from './Categories';

const Chatbots = ({ setWhich }) => {

  return (
    <div>
      <Header
        heading={"Chatbots"}
        desc={"Which teachers assistance would you like?"}
      />
      <Categories />
      <Productivity />
    </div>
  );
};

export default Chatbots;
import axios from 'axios';
import React, { createContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { backend_url } from '../util/variables';
import api from '../util/api';
import { toast } from 'react-toastify';

export const UsageContext = createContext();

export const UsageProvider = ({ children }) => {

    const [usage, setUsage] = useState(null);
    const [creditWidth, setCreditWidth] = useState(0)

    const fetchUsage = async () => {
        try {
            const { data } = await api.get('/getUsage');
            const { usage } = data
            setUsage(usage)
            console.log('Usage: ', usage);
            let width = Math.floor((usage?.usageCount * 100) / usage?.usageLimit)
            setCreditWidth(width);
        } catch (error) {
            toast("Error Usage Data")
        }
    }

    return (
        <UsageContext.Provider value={{ usage, creditWidth, fetchUsage }}>
            {children}
        </UsageContext.Provider>
    );
};
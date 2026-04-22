import React from 'react'
import Member from '../../components/member_lists/Member'
import Header from '../../components/header/Header'
import Search_icon from '../../components/search_icon/Search_icon'
import Footer from '../../components/footer/Footer'

function Home() {
  return (
    <>
    <Header/>
    <Member/>
    <Search_icon/>
    <Footer/>
    </>
  )
}

export default Home